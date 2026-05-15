// 구독(subscriptions) DB 조회 함수 모음
// 1인 1active 구독 원칙 (CLAUDE.md 참고)

import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { SubscriptionRow } from '@/types/db'

// 특정 user의 현재 active 구독 1건 조회 (없으면 null)
// ORDER BY started_at DESC, id DESC: active가 2개 이상일 경우 가장 최근 것 반환 (결정적 동작 보장)
// LIMIT 1: "1인 1active" 원칙 안전장치
export async function getActiveSubscriptionByUserId(
  userId: number
): Promise<SubscriptionRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, tier, status, next_billing_at, started_at, cancelled_at, pending_tier
     FROM subscriptions
     WHERE user_id = ? AND status = 'active'
     ORDER BY started_at DESC, id DESC
     LIMIT 1`,
    [userId]
  )
  // rows[0] ?? null: 결과 없으면 null 반환 (신규 가입자 케이스)
  return (rows[0] as SubscriptionRow) ?? null
}

// next_billing_at 지났는데 status='active' 상태인 구독을 'expired'로 일괄 변경
// Cloud Scheduler가 매일 호출 → 데이터 정합성 유지 (좀비 active 방지)
// 반환: 만료 처리된 행 개수
export async function expireOverdueSubscriptions(): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE subscriptions
     SET status = 'expired'
     WHERE status = 'active' AND next_billing_at < NOW()`
  )
  return result.affectedRows
}

// 특정 user의 active 구독에 pending_tier(예약 티어) 설정
// 다음 결제 시점에 tier로 적용됨 (즉시 변경 X)
// affectedRows 0이면 null 반환 (active 구독 없음)
export async function setPendingTierByUserId(
  userId: number,
  newTier: 'basic' | 'standard' | 'premium'
): Promise<SubscriptionRow | null> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE subscriptions
     SET pending_tier = ?
     WHERE user_id = ? AND status = 'active'`,
    [newTier, userId]
  )

  if (result.affectedRows === 0) return null

  // 업데이트된 active 구독 다시 SELECT (pending_tier 최신값 포함)
  return await getActiveSubscriptionByUserId(userId)
}

// 특정 user의 active 구독을 cancelled로 변경
// affectedRows 0이면 null 반환 (active 구독 없었던 경우)
// 성공 시 업데이트된 구독 행을 다시 SELECT해서 반환 (cancelled_at 최신값 포함)
export async function cancelSubscriptionByUserId(
  userId: number
): Promise<SubscriptionRow | null> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE user_id = ? AND status = 'active'`,
    [userId]
  )

  // 영향받은 행이 0이면 active 구독 없었음 → null
  if (result.affectedRows === 0) return null

  // 업데이트된 행을 다시 SELECT해서 최신 상태 반환 (cancelled_at NOW() 값 포함)
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, tier, status, next_billing_at, started_at, cancelled_at, pending_tier
     FROM subscriptions
     WHERE user_id = ? AND status = 'cancelled'
     ORDER BY cancelled_at DESC
     LIMIT 1`,
    [userId]
  )
  return (rows[0] as SubscriptionRow) ?? null
}
