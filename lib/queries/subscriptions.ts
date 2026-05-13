import pool from '@/lib/db'
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { SubscriptionRow } from '@/types/db'
import { Tier } from '@/lib/plans'

export async function getActiveSubscription(userId: number): Promise<SubscriptionRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, user_id, tier, status, next_billing_at, started_at, cancelled_at FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1",
    [userId],
  )
  return (rows[0] as SubscriptionRow) ?? null
}

export async function cancelActiveSubscriptionsTx(
  conn: PoolConnection,
  userId: number,
): Promise<void> {
  await conn.query(
    "UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE user_id = ? AND status = 'active'",
    [userId],
  )
}

export async function createSubscriptionTx(
  conn: PoolConnection,
  userId: number,
  tier: Tier,
  nextBillingAt: Date,
): Promise<number> {
  const [r] = await conn.query<ResultSetHeader>(
    "INSERT INTO subscriptions (user_id, tier, status, next_billing_at) VALUES (?, ?, 'active', ?)",
    [userId, tier, nextBillingAt],
  )
  return r.insertId
}

export async function cancelSubscriptionById(userId: number, subscriptionId: number): Promise<boolean> {
  const [r] = await pool.query<ResultSetHeader>(
    "UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE id = ? AND user_id = ? AND status = 'active'",
    [subscriptionId, userId],
  )
  return r.affectedRows > 0
}

export async function changeActiveTier(userId: number, tier: Tier): Promise<boolean> {
  const [r] = await pool.query<ResultSetHeader>(
    "UPDATE subscriptions SET tier = ? WHERE user_id = ? AND status = 'active'",
    [tier, userId],
  )
  return r.affectedRows > 0
}
