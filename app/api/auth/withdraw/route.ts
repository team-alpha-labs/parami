import { NextRequest, NextResponse } from 'next/server'
import { err } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { softDeleteUser, findUserById } from '@/lib/queries/users'

// DELETE /api/auth/withdraw — 회원 탈퇴 (soft delete + 익명화)
// users 행은 보존하되 email/name 익명화. payments/reward_logs/subscriptions는
// 회계·운영 통계 정합을 위해 그대로 둠. 자세한 정책은 softDeleteUser 참고.
export async function DELETE(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('인증이 필요합니다.', 401)

  const user = await findUserById(session.uid)
  if (!user) return err('유저를 찾을 수 없습니다.', 404)

  await softDeleteUser(session.uid)

  const res = NextResponse.json({ success: true, data: null })
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
