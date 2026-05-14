import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { findUserById, updateUserName } from '@/lib/queries/users'

export async function PATCH(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

  const body = (await request.json().catch(() => null)) as { name?: string } | null
  const name = body?.name?.trim()
  if (!name) return err('name은 필수입니다.', 400)
  if (name.length > 50) return err('name은 50자 이하로 입력해주세요.', 400)

  await updateUserName(session.uid, name)
  const user = await findUserById(session.uid)
  if (!user) return err('유저를 찾을 수 없습니다.', 404)

  return ok({ id: user.id, email: user.email, name: user.name, role: user.role })
}
