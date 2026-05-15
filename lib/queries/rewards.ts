// 보상(rewards) DB 조회 함수 모음

import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { RewardRow } from '@/types/db'
import type { Tier } from '@/lib/rewards'

// 특정 user의 보상 내역 전체 조회 (최신순)
// tier_at_reward: 지급 당시 티어 스냅샷 (현재 티어 바뀌어도 과거 기록 유지)
export async function getRewardsByUserId(userId: number): Promise<RewardRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, trigger_log_id, amount, tier_at_reward,
            reward_year, reward_month, rewarded_at
     FROM reward_logs
     WHERE user_id = ?
     ORDER BY rewarded_at DESC`,
    [userId]
  )
  return rows as RewardRow[]
}

// 보상 누적 요약 반환 타입 (DB 행이 아닌 계산 결과라 types/db.ts 대신 여기에 정의)
export type RewardSummary = {
  totalCount: number
  totalAmount: number
  thisMonthCount: number
}

// 특정 user의 보상 누적 요약 (총 횟수/총 금액/이번 달 횟수, KST 기준)
// 화면의 "축적 보상 X원 / 이번 달 N회" 같은 카운터에 사용
export async function getRewardSummaryByUserId(
  userId: number
): Promise<RewardSummary> {
  // KST 기준 현재 연/월 계산 (서버가 UTC라도 한국 시간으로 통일)
  // 현재 시각에 9시간 더한 후 getUTC*로 추출 = 한국 시각
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const year = kst.getUTCFullYear()
  const month = kst.getUTCMonth() + 1 // getMonth는 0~11 반환이라 +1로 1~12 변환

  // 전체 누적 (총 횟수 + 총 금액)
  // COALESCE(SUM(amount), 0): 보상 없을 때 NULL → 0 (응답에 totalAmount: null 방지)
  const [totalRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS totalCount, COALESCE(SUM(amount), 0) AS totalAmount
     FROM reward_logs
     WHERE user_id = ?`,
    [userId]
  )

  // 이번 달만 따로 (월 10회 캡 확인용으로도 유용)
  const [monthRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS thisMonthCount
     FROM reward_logs
     WHERE user_id = ? AND reward_year = ? AND reward_month = ?`,
    [userId, year, month]
  )

  // Number(...) 변환: mysql2가 COUNT/SUM 결과를 string으로 줄 수 있음 (BIGINT 호환성)
  // 명시적 변환으로 number 타입 보장 → 프론트에서 바로 연산 가능
  return {
    totalCount: Number(totalRows[0].totalCount),
    totalAmount: Number(totalRows[0].totalAmount),
    thisMonthCount: Number(monthRows[0].thisMonthCount),
  }
}

// 보상 지급 대상자 = active 구독 + 그 구독의 가장 최근 결제가 success
// 신규 가입 후 결제 없는 유저, 최근 결제가 fail/cancelled인 유저는 제외
//
// 1인 1active가 컨벤션이지만 DB UNIQUE 제약은 없어, 안전장치로 유저당 1행만 반환:
// 같은 user_id에 active가 2개 이상이면 가장 최근 started_at 행만 선택 (이중 지급 차단)
export type RewardEligibleRow = {
  user_id: number
  subscription_id: number
  tier: Tier
}
export async function getEligibleUsersForReward(): Promise<RewardEligibleRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.user_id, s.id AS subscription_id, s.tier
     FROM subscriptions s
     WHERE s.status = 'active'
       AND s.id = (
         SELECT s2.id FROM subscriptions s2
         WHERE s2.user_id = s.user_id AND s2.status = 'active'
         ORDER BY s2.started_at DESC, s2.id DESC
         LIMIT 1
       )
       AND (
         SELECT p.status FROM payments p
         WHERE p.subscription_id = s.id
         ORDER BY p.paid_at DESC, p.id DESC
         LIMIT 1
       ) = 'success'`,
  )
  return rows as RewardEligibleRow[]
}

// 특정 user의 해당 (KST) 연/월 보상 횟수 — 월 10회 캡 체크용
export async function getMonthlyRewardCount(args: {
  user_id: number
  year: number
  month: number
}): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM reward_logs
     WHERE user_id = ? AND reward_year = ? AND reward_month = ?`,
    [args.user_id, args.year, args.month],
  )
  return Number(rows[0].cnt)
}

// 보상 지급 단일 트랜잭션:
//   1) reward_logs INSERT  (UNIQUE(user_id, trigger_log_id)로 중복 방지)
//   2) users.balance += amount
// 두 동작이 원자적으로 함께 성공/실패해야 잔액-내역 불일치가 안 생긴다.
// 반환: inserted=true(신규 지급) / inserted=false(UNIQUE 위반으로 이미 지급됨)
export async function payoutReward(args: {
  user_id: number
  trigger_log_id: number
  amount: number
  tier: Tier
  year: number
  month: number
}): Promise<{ inserted: boolean }> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // INSERT IGNORE: 같은 user_id+trigger_log_id 조합이 이미 있으면 조용히 스킵
    // (스케줄러 재시도로 같은 트리거를 두 번 처리해도 잔액이 두 번 늘지 않음)
    const [ins] = await conn.execute<ResultSetHeader>(
      `INSERT IGNORE INTO reward_logs
         (user_id, trigger_log_id, amount, tier_at_reward, reward_year, reward_month)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        args.user_id,
        args.trigger_log_id,
        args.amount,
        args.tier,
        args.year,
        args.month,
      ],
    )

    if (ins.affectedRows === 0) {
      // 이미 지급된 트리거 — 잔액 증가도 건너뜀
      await conn.commit()
      return { inserted: false }
    }

    await conn.execute(
      `UPDATE users SET balance = balance + ? WHERE id = ?`,
      [args.amount, args.user_id],
    )

    await conn.commit()
    return { inserted: true }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
