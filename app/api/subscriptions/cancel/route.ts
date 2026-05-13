import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { cancelSubscriptionById, getActiveSubscription } from '@/lib/queries/subscriptions'

export async function PATCH(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

  const sub = await getActiveSubscription(session.uid)
  if (!sub) return err('해지할 active 구독이 없습니다.', 404)

  const ok_ = await cancelSubscriptionById(session.uid, sub.id)
  if (!ok_) return err('구독 해지에 실패했습니다.', 500)

  return ok({ id: sub.id, status: 'cancelled' })
}
