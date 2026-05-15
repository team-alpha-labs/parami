// 결제(payments) DB 조회 함수 모음
//
// 시간 처리 컨벤션 (PR-2 리뷰 #4 반영):
//   subscriptions의 시각 컬럼은 UTC_TIMESTAMP()로 UTC 명시 저장 (서버 timezone 무관)
//   payments.billing_year/billing_month는 JS에서 KST로 계산
//     → 사용자에게 "5월 결제 / 6월 결제"가 한국 시간 기준으로 표시되도록
//   두 정책 모두 명시적 — 서버 timezone 설정 변경 시에도 동작 일관

import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { PaymentRow, SubscriptionRow } from '@/types/db'

// 클라이언트 노출용 타입 — toss_payment_key는 결제 취소/환불 권한키라 응답에서 제외
export type PaymentPublic = Omit<PaymentRow, 'toss_payment_key'>

// 특정 user의 결제 내역 전체 조회 (최신순)
// ORDER BY paid_at DESC: 최신 결제가 위로 (정렬 없으면 DB가 임의 순서 반환)
// toss_payment_key 제외: 결제 취소/환불에 쓰이는 권한키라 클라이언트 노출 X
export async function getPaymentsByUserId(userId: number): Promise<PaymentPublic[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, subscription_id, amount, method, status,
            toss_order_id, billing_year, billing_month, paid_at
     FROM payments
     WHERE user_id = ?
     ORDER BY paid_at DESC`,
    [userId]
  )
  // 결제 없으면 빈 배열 [] 반환 (null 아님 — 리스트는 비어있을 수 있어도 누락 아님)
  return rows as PaymentPublic[]
}

// 토스 결제 확정 후 DB 처리 전체를 트랜잭션으로 묶은 함수
// 시나리오:
//   A. active 구독 없음 → 새 구독 INSERT
//   B/C. active 구독 있음 → tier 덮어쓰기 + pending_tier 클리어 + next_billing_at 연장
// 두 시나리오 모두 payments INSERT는 동일
// 중간 실패 시 ROLLBACK으로 원자성 보장 (결제 기록만 들어가고 구독은 안 만들어지는 사고 방지)
//
// 타임존 정책 (PR-2 리뷰 #4 반영):
//   subscriptions/payments의 시각 컬럼은 모두 KST 저장
//   DB 서버 UTC 가정 → NOW()에 +9 HOUR 더해 KST로 변환
//   billing_year/billing_month도 JS에서 KST 계산 (timestamp 컬럼과 같은 시간대로 일관성 유지)
export async function processConfirmedPayment(
  userId: number,
  tier: 'basic' | 'standard' | 'premium',
  amount: number,
  tossOrderId: string,
  tossPaymentKey: string
): Promise<{ subscription: SubscriptionRow; payment: PaymentPublic }> {
  // 풀에서 단일 연결 빌림 (트랜잭션은 같은 연결에서 BEGIN→COMMIT 필요)
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // billing_year/billing_month: KST 기준 한국 비즈니스 월
    // UTC 시각 + 9시간 후 getUTC* → 한국 시각의 연/월 추출
    const now = new Date()
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const billingYear = kst.getUTCFullYear()
    const billingMonth = kst.getUTCMonth() + 1

    // 1) 본인 active 구독 조회 (ORDER BY로 결정적 동작 보장)
    const [subRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, user_id, tier, status, next_billing_at, started_at, cancelled_at, pending_tier
       FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY started_at DESC, id DESC
       LIMIT 1`,
      [userId]
    )

    let subscriptionId: number

    if (subRows.length === 0) {
      // 시나리오 A: 신규 가입 — 새 active 구독 생성
      // started_at, next_billing_at: KST 기준 (NOW()는 UTC 가정 → +9h 변환)
      // next_billing_at = KST 현재 + 1 month (이중 DATE_ADD)
      const [insertResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO subscriptions (user_id, tier, status, started_at, next_billing_at, pending_tier)
         VALUES (
           ?, ?, 'active',
           DATE_ADD(NOW(), INTERVAL 9 HOUR),
           DATE_ADD(DATE_ADD(NOW(), INTERVAL 9 HOUR), INTERVAL 1 MONTH),
           NULL
         )`,
        [userId, tier]
      )
      subscriptionId = insertResult.insertId
    } else {
      // 시나리오 B/C: 갱신 (같은 티어 / 티어 변경 모두 동일 처리)
      // tier 덮어쓰기 + pending_tier NULL로 리셋 + next_billing_at 한 달 연장 (KST 기준)
      // 호출자(route)가 effectiveTier(서버 권위)를 결정해서 넘기므로 그대로 적용
      subscriptionId = subRows[0].id as number
      await conn.query<ResultSetHeader>(
        `UPDATE subscriptions
         SET tier = ?,
             pending_tier = NULL,
             next_billing_at = DATE_ADD(DATE_ADD(NOW(), INTERVAL 9 HOUR), INTERVAL 1 MONTH)
         WHERE id = ?`,
        [tier, subscriptionId]
      )
    }

    // 2) payments INSERT
    // status='success' — 토스 검증 통과 후 이 함수가 호출되므로 항상 성공
    // toss_order_id UNIQUE 제약 → 동일 orderId 두 번 confirm 시도 시 여기서 차단
    // paid_at: schema DEFAULT는 NOW()(UTC)라 KST 일관성 위해 명시 INSERT
    await conn.query<ResultSetHeader>(
      `INSERT INTO payments
         (user_id, subscription_id, amount, method, status,
          toss_order_id, toss_payment_key, billing_year, billing_month, paid_at)
       VALUES (?, ?, ?, 'toss', 'success', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 9 HOUR))`,
      [userId, subscriptionId, amount, tossOrderId, tossPaymentKey, billingYear, billingMonth]
    )

    await conn.commit()

    // 3) 결과 반환용 SELECT (commit 후 동일 conn으로 조회)
    // subscription은 최신 상태 (tier/pending_tier/next_billing_at 갱신 반영)
    const [finalSubRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, user_id, tier, status, next_billing_at, started_at, cancelled_at, pending_tier
       FROM subscriptions WHERE id = ?`,
      [subscriptionId]
    )

    // payment 응답에는 toss_payment_key 제외 (클라이언트 노출 안 함)
    const [finalPayRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, user_id, subscription_id, amount, method, status,
              toss_order_id, billing_year, billing_month, paid_at
       FROM payments WHERE toss_order_id = ?`,
      [tossOrderId]
    )

    return {
      subscription: finalSubRows[0] as SubscriptionRow,
      payment: finalPayRows[0] as PaymentPublic,
    }
  } catch (error) {
    // 중간 실패 시 트랜잭션 롤백 → 부분 저장 방지
    await conn.rollback()
    throw error
  } finally {
    // 성공/실패 무관하게 연결 반납 (안 하면 풀 고갈)
    conn.release()
  }
}
