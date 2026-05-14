import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { err } from '@/lib/api'
import { signToken } from '@/lib/auth'
import { findLocalAccountByUserId, findUserByEmail } from '@/lib/queries/users'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || !body.password) return err('email, password는 필수입니다.', 400)

  const user = await findUserByEmail(body.email)
  if (!user) return err('이메일 또는 비밀번호가 일치하지 않습니다.', 401)

  const account = await findLocalAccountByUserId(user.id)
  if (!account?.password) return err('이메일 또는 비밀번호가 일치하지 않습니다.', 401)

  const matched = await bcrypt.compare(body.password, account.password)
  if (!matched) return err('이메일 또는 비밀번호가 일치하지 않습니다.', 401)

  const token = signToken({ uid: user.id, role: user.role })
  const res = NextResponse.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
  res.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
