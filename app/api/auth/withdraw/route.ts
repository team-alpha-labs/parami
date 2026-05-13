import { NextRequest, NextResponse } from 'next/server'
import { err } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { deleteUserCascade, findUserById } from '@/lib/queries/users'

export async function DELETE(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

  const user = await findUserById(session.uid)
  if (!user) return err('유저를 찾을 수 없습니다.', 404)

  await deleteUserCascade(session.uid)

  const res = NextResponse.json({ success: true, data: null })
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
