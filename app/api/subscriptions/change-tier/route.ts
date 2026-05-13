import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { isTier } from '@/lib/plans'
import { changeActiveTier, getActiveSubscription } from '@/lib/queries/subscriptions'

export async function PATCH(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

  const body = await request.json().catch(() => null) as { tier?: string } | null
  if (!body || !isTier(body.tier)) return err('tier는 basic|standard|premium 중 하나여야 합니다.', 400)

  const updated = await changeActiveTier(session.uid, body.tier)
  if (!updated) return err('변경할 active 구독이 없습니다.', 404)

  const sub = await getActiveSubscription(session.uid)
  return ok(sub)
}
