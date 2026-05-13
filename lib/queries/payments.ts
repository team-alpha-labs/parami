import pool from '@/lib/db'
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { PaymentRow } from '@/types/db'
import { Tier, PLANS } from '@/lib/plans'
import { cancelActiveSubscriptionsTx, createSubscriptionTx } from './subscriptions'

export async function findPaymentByOrderId(orderId: string): Promise<PaymentRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM payments WHERE toss_order_id = ? LIMIT 1',
    [orderId],
  )
  return (rows[0] as PaymentRow) ?? null
}

export async function listMyPayments(userId: number): Promise<PaymentRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM payments WHERE user_id = ? ORDER BY paid_at DESC LIMIT 100',
    [userId],
  )
  return rows as PaymentRow[]
}

/**
 * 토스 결제 승인 직후 호출.
 * 기존 active 구독 cancel → 신규 active 구독 INSERT → payments INSERT (한 트랜잭션).
 */
export async function confirmPaymentAndCreateSubscription(params: {
  userId: number
  tier: Tier
  tossOrderId: string
  tossPaymentKey: string
  amount: number
}): Promise<{ paymentId: number; subscriptionId: number }> {
  const { userId, tier, tossOrderId, tossPaymentKey, amount } = params

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await cancelActiveSubscriptionsTx(conn, userId)

    const nextBillingAt = new Date()
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1)
    const subscriptionId = await createSubscriptionTx(conn, userId, tier, nextBillingAt)

    const now = new Date()
    const [pr] = await conn.query<ResultSetHeader>(
      `INSERT INTO payments
       (user_id, subscription_id, amount, method, status, toss_order_id, toss_payment_key, billing_year, billing_month)
       VALUES (?, ?, ?, 'toss', 'success', ?, ?, ?, ?)`,
      [userId, subscriptionId, amount, tossOrderId, tossPaymentKey, now.getFullYear(), now.getMonth() + 1],
    )

    await conn.commit()
    return { paymentId: pr.insertId, subscriptionId }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export function expectedAmountForTier(tier: Tier): number {
  return PLANS[tier].price
}
