import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { getActiveSubscription } from '@/lib/queries/subscriptions'

export async function GET(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)
  const sub = await getActiveSubscription(session.uid)
  return ok(sub)
}
