// 결제(payments) DB 조회 함수 모음

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'
import { PaymentRow } from '@/types/db'

// 특정 user의 결제 내역 전체 조회 (최신순)
// ORDER BY paid_at DESC: 최신 결제가 위로 (정렬 없으면 DB가 임의 순서 반환)
export async function getPaymentsByUserId(userId: number): Promise<PaymentRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id, subscription_id, amount, method, status,
            toss_order_id, toss_payment_key, billing_year, billing_month, paid_at
     FROM payments
     WHERE user_id = ?
     ORDER BY paid_at DESC`,
    [userId]
  )
  // 결제 없으면 빈 배열 [] 반환 (null 아님 — 리스트는 비어있을 수 있어도 누락 아님)
  return rows as PaymentRow[]
}
