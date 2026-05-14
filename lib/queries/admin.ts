// 관리자 조회 전용 쿼리 모음
// 모든 함수는 관리자 권한 검증(requireAdmin) 후에만 호출되어야 함

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export type AdminUserRow = {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  balance: number
  created_at: Date
}

export async function listAllUsers(): Promise<AdminUserRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, name, role, balance, created_at
     FROM users
     ORDER BY created_at DESC, id DESC`,
  )
  return rows as AdminUserRow[]
}

export type AdminSubscriptionRow = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  tier: 'basic' | 'standard' | 'premium'
  status: 'active' | 'cancelled'
  next_billing_at: Date | null
  started_at: Date
  cancelled_at: Date | null
}

export async function listAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.user_id, u.email AS user_email, u.name AS user_name,
            s.tier, s.status, s.next_billing_at, s.started_at, s.cancelled_at
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.started_at DESC, s.id DESC`,
  )
  return rows as AdminSubscriptionRow[]
}

export type AdminPaymentRow = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  subscription_id: number
  amount: number
  method: string
  status: 'success' | 'fail' | 'cancelled'
  toss_order_id: string
  billing_year: number | null
  billing_month: number | null
  paid_at: Date
}

// toss_payment_key는 결제 취소/환불 권한키라 관리자 응답에서도 제외
export async function listAllPayments(): Promise<AdminPaymentRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.user_id, u.email AS user_email, u.name AS user_name,
            p.subscription_id, p.amount, p.method, p.status,
            p.toss_order_id, p.billing_year, p.billing_month, p.paid_at
     FROM payments p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.paid_at DESC, p.id DESC`,
  )
  return rows as AdminPaymentRow[]
}
