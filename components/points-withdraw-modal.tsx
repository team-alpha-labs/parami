'use client'

// 보상금 출금 모달 — POST /api/rewards/withdraw 호출
// 사용처: app/(consumer)/mypage/page.tsx (controlled 형태)
//
// 정책 (lib/queries/users.ts MIN_WITHDRAW_AMOUNT):
//   - 최소 출금 금액 5만원
//   - 단위·한도·횟수 제한 없음 (정수 + 잔액 이하면 OK)
//   - MVP: 실제 송금 미구현 — balance 차감 + withdrawal_logs 기록만
//
// UX (D 패턴 — 자유 입력 + 빠른 입력 칩):
//   - 잔액 표시 (info 톤)
//   - 빠른 입력 칩: 5만 / 10만 / +5만 / 전액
//   - 자유 입력 + 실시간 검증 (5만 이상 + 잔액 이하 + 정수)
//   - 송금 미지원 안내 (warning 톤)
//   - 동의 체크박스 + 출금하기 버튼
//
// 카피: 토스 UX 라이팅 가이드 (동사형 종결 / 능동형 / 친근 경어)

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, Wallet } from 'lucide-react'
import { api, ApiError } from '@/lib/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MIN_WITHDRAW = 50000

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  balance: number // 출금 가능 금액 (me.balance)
}

export function PointsWithdrawModal({ open, onOpenChange, balance }: Props) {
  const queryClient = useQueryClient()
  const [amountStr, setAmountStr] = useState('')
  const [agreed, setAgreed] = useState(false)

  // 문자열 입력에서 정수 추출 (콤마/공백 제거). 빈 값/숫자 아님 → 0
  const amount = Number((amountStr || '0').replace(/[^0-9]/g, '')) || 0

  // 검증 (UI 사전 차단 — API에서도 한 번 더 검증)
  const tooSmall = amount > 0 && amount < MIN_WITHDRAW
  const overBalance = amount > balance
  const isValid = amount >= MIN_WITHDRAW && amount <= balance

  const withdraw = useMutation({
    mutationFn: () => api.post('/api/rewards/withdraw', { amount }),
    onSuccess: () => {
      toast.success(`${amount.toLocaleString()}원을 출금했어요.`)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['rewards', 'summary'] })
      onOpenChange(false)
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : '출금하지 못했어요.'
      toast.error(msg)
    },
  })

  // 닫을 때 입력/동의 리셋
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmountStr('')
      setAgreed(false)
    }
    onOpenChange(next)
  }

  // 칩 핸들러
  const setAmount = (v: number) => setAmountStr(String(v))
  const addAmount = (v: number) => setAmountStr(String(amount + v))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>출금하기</DialogTitle>
          <DialogDescription>얼마를 출금할까요?</DialogDescription>
        </DialogHeader>

        {/* 현재 잔액 — info 톤 (primary) */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
            <Wallet className="h-5 w-5" />
            <p>출금 가능 금액</p>
          </div>
          <p className="pl-7 text-2xl font-bold text-foreground">
            {balance.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">원</span>
          </p>
        </div>

        {/* 빠른 입력 칩 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAmount(50000)}
            className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            5만
          </button>
          <button
            type="button"
            onClick={() => setAmount(100000)}
            className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            10만
          </button>
          <button
            type="button"
            onClick={() => addAmount(50000)}
            className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            +5만
          </button>
          <button
            type="button"
            onClick={() => setAmount(balance)}
            className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
          >
            전액
          </button>
        </div>

        {/* 입력 필드 */}
        <div>
          <label htmlFor="withdraw-amount" className="text-sm font-medium text-foreground">
            출금 금액
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="withdraw-amount"
              type="text"
              inputMode="numeric"
              value={amount ? amount.toLocaleString() : ''}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="50,000"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-right text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">원</span>
          </div>
          {/* 실시간 검증 메시지 */}
          {tooSmall && (
            <p className="mt-1.5 text-xs text-destructive">
              5만원부터 출금할 수 있어요.
            </p>
          )}
          {overBalance && (
            <p className="mt-1.5 text-xs text-destructive">
              최대 {balance.toLocaleString()}원까지 출금할 수 있어요.
            </p>
          )}
        </div>

        {/* 출금 전 확인 사항 — warning 톤 */}
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold text-warning">
            <AlertCircle className="h-5 w-5" />
            <p>꼭 확인해 주세요</p>
          </div>
          <ul className="space-y-1 pl-7 text-foreground">
            <li className="list-disc">출금하면 잔액에서 바로 빠져나가요</li>
            <li className="list-disc">5만원부터 출금할 수 있어요</li>
          </ul>
        </div>

        {/* 동의 체크박스 */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
          />
          내용을 모두 확인했어요.
        </label>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={withdraw.isPending}
          >
            돌아가기
          </Button>
          <Button
            onClick={() => withdraw.mutate()}
            disabled={!isValid || !agreed || withdraw.isPending}
          >
            {withdraw.isPending ? '출금 중...' : '출금하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
