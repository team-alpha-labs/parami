// 구독(subscriptions) DB 조회 함수 모음
// 1인 1active 구독 원칙 (CLAUDE.md 참고)

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'
import { SubscriptionRow } from '@/types/db'

// 특정 user의 현재 active 구독 1건 조회 (없으면 null)
// LIMIT 1: "1인 1active" 원칙 안전장치 (DB에 만약 active가 2개여도 1개만 반환)
export async function getActiveSubscriptionByUserId(
  userId: number
): Promise<SubscriptionRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, tier, status, next_billing_at, started_at, cancelled_at
     FROM subscriptions
     WHERE user_id = ? AND status = 'active'
     LIMIT 1`,
    [userId]
  )
  // rows[0] ?? null: 결과 없으면 null 반환 (신규 가입자 케이스)
  return (rows[0] as SubscriptionRow) ?? null
}
