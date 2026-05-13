import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listPayments } from '@/lib/queries/admin'

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return err('관리자 권한이 필요합니다.', 403)
  return ok(await listPayments())
}
