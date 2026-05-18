'use client'

// 회원탈퇴 모달 — DELETE /api/auth/withdraw 호출
// 마이페이지 등에서 controlled 형태로 사용 (open/onOpenChange)
//
// 흐름:
//   1) 기본 동의 체크 → "탈퇴하기" 활성
//   2) active 구독자는 잔여 기간 손실 경고 + 추가 동의 체크 필수
//   3) DELETE 요청 → 서버가 토큰 쿠키 무효화 + soft delete + 익명화
//   4) 전체 캐시 정리 + 토스트 + 랜딩(/)으로 이동
//
// soft delete 정책:
//   - users 행 보존 + email/name 익명화 + deleted_at 기록
//   - 결제·보상·구독 이력 그대로 (회계/통계 정합)
//   - active 구독은 자동으로 cancelled 전환 (잔여 기간 환불 없음)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, AlertTriangle } from 'lucide-react'
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 호출 쪽(mypage)이 이미 갖고 있는 구독 상태를 prop으로 전달.
  // active 구독자는 추가 경고 + 별도 체크박스로 잔여 기간 손실 동의 필요.
  hasActiveSubscription?: boolean
}

export function WithdrawModal({
  open,
  onOpenChange,
  hasActiveSubscription = false,
}: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [agreed, setAgreed] = useState(false)
  const [agreedLoss, setAgreedLoss] = useState(false)

  const canSubmit = agreed && (!hasActiveSubscription || agreedLoss)

  const withdraw = useMutation({
    mutationFn: () => api.delete('/api/auth/withdraw'),
    onSuccess: () => {
      toast.success('회원 탈퇴가 완료됐어요.')
      // 탈퇴 후 같은 브라우저에서 다른 계정 재로그인 시 이전 데이터 잔존 방지
      queryClient.clear()
      onOpenChange(false)
      router.push('/')
      // 서버 컴포넌트 Header가 쿠키를 직접 읽으므로 RSC 재실행 필요
      router.refresh()
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : '회원 탈퇴에 실패했어요.'
      toast.error(msg)
    },
  })

  // 모달 닫을 때 동의 상태 리셋
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAgreed(false)
      setAgreedLoss(false)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 탈퇴</DialogTitle>
          <DialogDescription>
            탈퇴하면 계정이 비활성화되고 로그인할 수 없어요.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">탈퇴 후 변경 사항</p>
          </div>
          <ul className="mt-3 space-y-1.5 pl-7 text-sm text-foreground">
            <li className="list-disc">로그인 불가 — 같은 이메일로 재가입은 가능해요</li>
            <li className="list-disc">계정 정보(이메일·이름)는 익명 처리</li>
            <li className="list-disc">결제·보상 내역은 회계 정합을 위해 보존</li>
          </ul>
        </div>

        {/* active 구독자 추가 경고 — 잔여 기간 환불 불가 안내 */}
        {hasActiveSubscription && (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-semibold">구독 중 탈퇴 안내</p>
            </div>
            <p className="mt-3 pl-7 text-sm text-foreground">
              현재 구독 중이세요. 탈퇴하면 잔여 이용 기간이 즉시 종료되고,
              이미 결제한 금액은 환불되지 않아요.
            </p>
            <p className="mt-2 pl-7 text-xs text-muted-foreground">
              먼저 마이페이지에서 가입 해지 후 다음 결제일이 지나면 손실 없이 탈퇴할 수 있어요.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
            />
            위 내용을 확인했고, 회원 탈퇴에 동의해요.
          </label>

          {hasActiveSubscription && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={agreedLoss}
                onChange={(e) => setAgreedLoss(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
              />
              구독 잔여 기간 손실에 동의합니다.
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={withdraw.isPending}
          >
            돌아가기
          </Button>
          <Button
            variant="destructive"
            disabled={!canSubmit || withdraw.isPending}
            onClick={() => withdraw.mutate()}
          >
            {withdraw.isPending ? '탈퇴 처리 중...' : '탈퇴하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
