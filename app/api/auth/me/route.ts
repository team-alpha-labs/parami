import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { findUserById } from '@/lib/queries/users'

export async function GET(request: NextRequest) {
  // 비로그인은 200 + data:null로 응답 — 공개 페이지(/, /pricing 등)의 useMe() 호출에서
  // 콘솔에 401 노이즈가 찍히는 문제 해소. 인증 의미가 진짜 필요한 다른 API(/auth/profile,
  // /rewards/withdraw 등)는 그대로 401 유지.
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
