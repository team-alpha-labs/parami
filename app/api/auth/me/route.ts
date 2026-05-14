import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { findUserById } from '@/lib/queries/users'

export async function GET(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

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
