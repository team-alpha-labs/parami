import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { MIN_WITHDRAW_AMOUNT, withdrawPoints } from '@/lib/queries/users'

export async function POST(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('로그인이 필요합니다.', 401)

  try {
    const result = await withdrawPoints(session.uid)
    if (!result.ok) {
      return err(
        `포인트가 부족합니다. (최소 ${MIN_WITHDRAW_AMOUNT.toLocaleString()}원 필요)`,
        400,
      )
    }
    return ok({
      withdrawn: MIN_WITHDRAW_AMOUNT,
      balance: result.balance,
      withdrawalId: result.withdrawalId,
    })
  } catch (error) {
    console.error('POST /api/rewards/withdraw error:', error)
    return err('출금 처리 실패', 500)
  }
}
