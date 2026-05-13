import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { err, ok } from '@/lib/api'
import { createLocalUser, findUserByEmail } from '@/lib/queries/users'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string; name?: string } | null
  if (!body?.email || !body.password || !body.name) {
    return err('email, password, name은 필수입니다.', 400)
  }
  const exists = await findUserByEmail(body.email)
  if (exists) return err('이미 가입된 이메일입니다.', 409)

  const hash = await bcrypt.hash(body.password, 10)
  const userId = await createLocalUser(body.email, body.name, hash)
  return ok({ id: userId, email: body.email, name: body.name }, { status: 201 })
}
