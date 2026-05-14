import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listAllSubscriptions } from '@/lib/queries/admin'

export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request)
    if (!session) return err('관리자 권한이 필요합니다.', 403)

    const subscriptions = await listAllSubscriptions()
    return ok(subscriptions)
  } catch (error) {
    console.error('GET /api/admin/subscriptions error:', error)
    return err('구독 현황 조회 실패', 500)
  }
}
