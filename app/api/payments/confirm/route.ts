import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { isTier } from '@/lib/plans'
import {
  confirmPaymentAndCreateSubscription,
  expectedAmountForTier,
  findPaymentByOrderId,
} from '@/lib/queries/payments'

/**
 * POST /api/payments/confirm
 * body: { paymentKey, orderId, amount, tier }
 *
 * 1) 토스 결제 승인 API 호출 (TOSS_SECRET_KEY)
 * 2) 성공 시 기존 active 구독 cancel + 신규 active 구독 INSERT + payments INSERT
 */
export async function POST(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

  const body = await request.json().catch(() => null) as
    | { paymentKey?: string; orderId?: string; amount?: number; tier?: string }
    | null
  if (!body?.paymentKey || !body.orderId || typeof body.amount !== 'number' || !isTier(body.tier)) {
    return err('paymentKey, orderId, amount, tier는 필수입니다.', 400)
  }

  if (body.amount !== expectedAmountForTier(body.tier)) {
    return err('티어 금액이 일치하지 않습니다.', 400)
  }

  const duplicate = await findPaymentByOrderId(body.orderId)
  if (duplicate) return err('이미 처리된 주문입니다.', 409)

  const secret = process.env.TOSS_SECRET_KEY
  if (!secret) return err('결제 설정 오류 (TOSS_SECRET_KEY 누락).', 500)
  const auth = 'Basic ' + Buffer.from(secret + ':').toString('base64')

  const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.amount,
    }),
  })

  if (!tossRes.ok) {
    const tossErr = await tossRes.json().catch(() => ({}))
    return err(tossErr.message || '토스 결제 승인 실패', 402)
  }

  const { paymentId, subscriptionId } = await confirmPaymentAndCreateSubscription({
    userId: session.uid,
    tier: body.tier,
    tossOrderId: body.orderId,
    tossPaymentKey: body.paymentKey,
    amount: body.amount,
  })

  return ok({ paymentId, subscriptionId }, { status: 201 })
}
