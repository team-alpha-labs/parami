// 보상(rewards) DB 조회 함수 모음

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export interface Reward {
  id: number
  user_id: number
  trigger_log_id: number
  amount: number
  tier_at_reward: 'basic' | 'standard' | 'premium'
  reward_year: number
  reward_month: number
  rewarded_at: Date
}

// 특정 user의 보상 내역 전체 조회 (최신순)
// tier_at_reward: 지급 당시 티어 스냅샷 (현재 티어 바뀌어도 과거 기록 유지)
export async function getRewardsByUserId(userId: number): Promise<Reward[]> {
  const [rows] = await pool.query<(Reward & RowDataPacket)[]>(
    `SELECT id, user_id, trigger_log_id, amount, tier_at_reward,
            reward_year, reward_month, rewarded_at
     FROM reward_logs
     WHERE user_id = ?
     ORDER BY rewarded_at DESC`,
    [userId]
  )
  return rows
}

export interface RewardSummary {
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
