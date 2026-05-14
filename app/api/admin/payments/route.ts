import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listAllPayments } from '@/lib/queries/admin'

export async function GET(request: NextRequest) {
  const session = requireAdmin(request)
  if (!session) return err('관리자 권한이 필요합니다.', 403)

  const payments = await listAllPayments()
  return ok(payments)
}
