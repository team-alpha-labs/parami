import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listAllUsers } from '@/lib/queries/admin'

export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request)
    if (!session) return err('관리자 권한이 필요합니다.', 403)

    const users = await listAllUsers()
    return ok(users)
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return err('유저 목록 조회 실패', 500)
  }
}
