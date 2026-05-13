import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2/promise'

export async function listUsers() {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, balance, created_at FROM users ORDER BY id DESC LIMIT 500',
  )
  return rows
}

export async function listSubscriptions() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.user_id, u.email, s.tier, s.status, s.next_billing_at, s.started_at, s.cancelled_at
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.id DESC LIMIT 500`,
  )
  return rows
}

export async function listPayments() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.user_id, u.email, p.subscription_id, p.amount, p.method, p.status,
            p.toss_order_id, p.billing_year, p.billing_month, p.paid_at
     FROM payments p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.id DESC LIMIT 500`,
  )
  return rows
}

export async function listTriggers() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.weather_log_id, t.trigger_type, t.triggered_at, t.triggered_date
     FROM trigger_logs t
     ORDER BY t.id DESC LIMIT 500`,
  )
  return rows
}

export async function listRewards() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.user_id, u.email, r.trigger_log_id, t.trigger_type, r.amount, r.tier_at_reward,
            r.reward_year, r.reward_month, r.rewarded_at
     FROM reward_logs r
     JOIN users u ON u.id = r.user_id
     JOIN trigger_logs t ON t.id = r.trigger_log_id
     ORDER BY r.id DESC LIMIT 500`,
  )
  return rows
}
