import { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import { findPlanByTier } from '@/lib/plans'
import { processConfirmedPayment } from '@/lib/queries/payments'
import { getActiveSubscriptionByUserId } from '@/lib/queries/subscriptions'
import { cancelTossPayment } from '@/lib/toss'

// 허용 티어 (DB ENUM과 일치)
const VALID_TIERS = ['basic', 'standard', 'premium'] as const
type Tier = (typeof VALID_TIERS)[number]

// 토스 결제 확정 API 엔드포인트 (운영/테스트 동일)
const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm'

// POST /api/payments/confirm
// 프론트가 토스 결제창에서 받은 (paymentKey, orderId, amount, tier)을 전달
// 백엔드가 토스 API로 결제 진위 검증 후 payments + subscriptions DB 처리 (트랜잭션)
//
// 서버 권위 원칙 (PR-2 리뷰 #3 반영):
//   - 결제 시점에 적용할 tier는 "서버가 결정한 effectiveTier"
//   - active 있고 pending_tier 있음 → pending_tier 우선 (티어 변경 예약 적용)
//   - active 있고 pending_tier 없음 → 기존 tier 유지 (단순 갱신)
//   - active 없음 → body.tier (신규 가입)
//   - 클라이언트가 보낸 body.tier는 신규 가입 케이스에만 권위. 그 외엔 무시.
export async function POST(request: NextRequest) {
  try {
    // 1) 인증 확인
    const session = requireUser(request)
    if (!session) return err('로그인이 필요합니다.', 401)

    // 2) body 파싱 + 필수 필드 검증
    const body = (await request.json().catch(() => null)) as {
      paymentKey?: string
      orderId?: string
      amount?: number
      tier?: string
    } | null

    if (!body?.paymentKey || !body.orderId || !body.amount || !body.tier) {
      return err('paymentKey, orderId, amount, tier는 필수입니다.', 400)
    }

    // 3) body.tier 형식 유효성 (DB ENUM 위반 방지)
    if (!VALID_TIERS.includes(body.tier as Tier)) {
      return err('tier는 basic/standard/premium 중 하나여야 합니다.', 400)
    }

    // 4) 서버 권위 effectiveTier 결정
    // active 구독 상태를 서버가 직접 조회 후 결정 (프론트 신뢰 X)
    const currentSub = await getActiveSubscriptionByUserId(session.uid)
    let effectiveTier: Tier
    if (currentSub) {
      // 기존 구독자: pending_tier 있으면 그게 새 티어, 없으면 기존 유지
      effectiveTier = (currentSub.pending_tier ?? currentSub.tier) as Tier
    } else {
      // 신규 가입: body.tier 사용
      effectiveTier = body.tier as Tier
    }

    // 5) amount 변조 검증 (effectiveTier 기준 가격과 대조)
    // 클라이언트가 "premium" 주장하면서 amount는 7,400원으로 보내는 공격 차단
    // 서버 측 가격(DB plans 테이블)이 권위
    const plan = await findPlanByTier(effectiveTier)
    if (!plan) return err('유효하지 않은 티어입니다.', 400)
    if (plan.price !== body.amount) {
      return err('결제 금액이 티어 가격과 일치하지 않습니다.', 400)
    }

    // 6) TOSS_SECRET_KEY 환경변수 확인
    const tossSecret = process.env.TOSS_SECRET_KEY
    if (!tossSecret) {
      console.error('TOSS_SECRET_KEY 환경변수 누락')
      return err('결제 서버 설정 오류.', 500)
    }

    // 7) 토스 API 호출 — Basic Auth 헤더는 base64(SECRET:)
    // 토스 인증 방식: 시크릿키 뒤에 ":" 붙이고 base64 인코딩 (RFC 7617)
    const authHeader = 'Basic ' + Buffer.from(tossSecret + ':').toString('base64')

    const tossRes = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey: body.paymentKey,
        orderId: body.orderId,
        amount: body.amount,
      }),
    })

    // 8) 토스 응답 처리
    // 200 외의 응답은 결제 거부/오류 — 클라이언트엔 generic 메시지
    if (!tossRes.ok) {
      const tossError = await tossRes.json().catch(() => ({}))
      console.error('Toss API confirm 실패:', tossRes.status, tossError)
      return err('결제 검증 실패.', 400)
    }

    // 토스가 검증 OK → 결제 정말 발생한 것
    // 응답 body는 결제 상세 정보 (paymentKey, orderId, totalAmount, status 등)

    // 9) DB 트랜잭션 처리 (payments INSERT + subscriptions INSERT/UPDATE)
    // toss_order_id UNIQUE 제약으로 동일 orderId 두 번 확정 차단
    //
    // ⚠️ 여기서 실패하면 사용자 돈은 토스에 잡혀있지만 우리 DB엔 없음 → 자동 환불 처리
    // 별도 try/catch로 감싸서 "토스 성공 후 DB 실패" 케이스만 환불 분기로
    try {
      const result = await processConfirmedPayment(
        session.uid,
        effectiveTier,
        body.amount,
        body.orderId,
        body.paymentKey
      )
      return ok(result)
    } catch (dbError) {
      // DB 처리 실패 → 사용자 돈 보호 위해 토스에 환불 요청
      console.error(
        'CRITICAL: payment DB failure after Toss confirm — auto-refund 시도',
        { orderId: body.orderId, paymentKey: body.paymentKey, dbError }
      )

      try {
        await cancelTossPayment(body.paymentKey, '서버 DB 처리 실패로 인한 자동 환불')
        console.log(`[refund] orderId=${body.orderId} 환불 처리 완료`)
        return err('결제 처리 중 오류가 발생해 자동 환불되었습니다.', 500)
      } catch (refundError) {
        // 환불 자체도 실패 → 사용자 돈 묶임. 운영자 수동 처리 필수
        // 로그에 명확히 남겨야 운영팀이 추적 가능
        console.error(
          'CRITICAL: 환불 자체 실패 — 운영자 수동 처리 필요',
          { orderId: body.orderId, paymentKey: body.paymentKey, refundError }
        )
        return err(
          '결제 처리 실패. 환불도 자동 처리되지 않아 고객센터 문의 바랍니다.',
          500
        )
      }
    }
  } catch (error) {
    // body 파싱 / 토스 API 네트워크 오류 등 — 토스 confirm 호출 전 또는 호출 중 에러
    // 이 단계에선 결제가 우리 시스템에 확정되지 않았으므로 환불 불필요
    console.error('POST /api/payments/confirm error:', error)
    return err('결제 처리 실패.', 500)
  }
}
