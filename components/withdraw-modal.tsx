'use client'

// 회원탈퇴 모달 — DELETE /api/auth/withdraw 호출
// 마이페이지 등에서 controlled 형태로 사용 (open/onOpenChange)
//
// 흐름:
//   1) 동의 체크박스 ON → "탈퇴하기" 활성
//   2) DELETE 요청 → 서버가 토큰 쿠키 무효화 + cascade delete
//   3) 전체 캐시 정리 + 토스트 + 랜딩(/)으로 이동

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
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
}

export function WithdrawModal({ open, onOpenChange }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [agreed, setAgreed] = useState(false)

  const withdraw = useMutation({
    mutationFn: () => api.delete('/api/auth/withdraw'),
    onSuccess: () => {
      toast.success('회원 탈퇴가 완료됐어요.')
      // 탈퇴는 cascade delete라 rewards/subscriptions/payments 등 모든 사용자 쿼리가
      // 의미를 잃음. 같은 브라우저에서 다른 계정 재로그인 시 이전 데이터 잔존 방지:
      // ['me']만 invalidate가 아니라 캐시 전체를 비운다.
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
    if (!next) setAgreed(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원 탈퇴</DialogTitle>
          <DialogDescription>
            탈퇴 시 계정과 관련된 모든 데이터가 영구 삭제됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">삭제되는 정보</p>
          </div>
          <ul className="mt-3 space-y-1.5 pl-7 text-sm text-foreground">
            <li className="list-disc">구독·결제 내역</li>
            <li className="list-disc">보상 지급 내역과 누적 보상금</li>
            <li className="list-disc">계정 정보(이메일·이름)</li>
          </ul>
          <p className="mt-3 pl-7 text-xs text-muted-foreground">
            삭제된 데이터는 복구할 수 없어요.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
          />
          위 내용을 확인했으며, 회원 탈퇴에 동의합니다.
        </label>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={withdraw.isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            disabled={!agreed || withdraw.isPending}
            onClick={() => withdraw.mutate()}
          >
            {withdraw.isPending ? '탈퇴 처리 중...' : '탈퇴하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
