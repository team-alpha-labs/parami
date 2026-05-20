import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { findUserById } from '@/lib/queries/users'

export async function GET(request: NextRequest) {
  // 비로그인은 정상 응답으로 처리 (data: null) — 공개 페이지(/, /pricing) 콘솔 401 노이즈 방지.
  // 진짜 인증이 필요한 다른 API들은 그대로 401 유지.
  const session = requireUser(request)
  if (!session) return ok(null)

  const user = await findUserById(session.uid)
  if (!user) return err('유저를 찾을 수 없습니다.', 404)

  return ok({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    balance: user.balance,
    created_at: user.created_at,
  })
}
