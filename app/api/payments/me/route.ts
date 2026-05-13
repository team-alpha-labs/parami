import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { listMyPayments } from '@/lib/queries/payments'

export async function GET(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)
  const payments = await listMyPayments(session.uid)
  return ok(payments)
}
