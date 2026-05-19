import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth'
import { MIN_WITHDRAW_AMOUNT, withdrawPoints } from '@/lib/queries/users'

// POST /api/rewards/withdraw
//   Body: { amount: number }  — 출금 요청 금액 (KRW)
//   제약:
//     - amount는 정수 (원 단위, 소수점 X)
//     - amount >= MIN_WITHDRAW_AMOUNT (5만원)
//     - balance >= amount (잔액 부족 시 400)
export async function POST(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return err('로그인이 필요합니다.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return err('요청 본문(JSON)이 필요합니다.', 400)
  }

  const amount = (body as { amount?: unknown })?.amount
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return err('amount는 정수여야 합니다.', 400)
  }
  if (amount < MIN_WITHDRAW_AMOUNT) {
    return err(
      `출금 금액은 최소 ${MIN_WITHDRAW_AMOUNT.toLocaleString()}원 이상이어야 합니다.`,
      400,
    )
  }

  try {
    const result = await withdrawPoints(session.uid, amount)
    if (!result.ok) {
      return err('잔액이 부족합니다.', 400)
    }
    return ok({
      withdrawn: amount,
      balance: result.balance,
      withdrawalId: result.withdrawalId,
    })
  } catch (error) {
    console.error('POST /api/rewards/withdraw error:', error)
    return err('출금 처리 실패', 500)
  }
}
