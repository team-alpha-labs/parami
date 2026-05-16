'use client'

// /cancel-subscription — active 구독을 cancelled로 전환 (PATCH /api/subscriptions/cancel)
//
// 흐름:
//   1) 주의사항 안내 + 사유 입력(선택) + 동의 체크박스 표시
//   2) 동의 체크 ON일 때만 해지하기 버튼 활성화 (오조작 방지)
//   3) 해지 성공 → 토스트 + ['subscriptions','me'] 캐시 무효화 → /mypage로 이동
//
// 해지 사유(reason)는 디자인상 수집하지만 백엔드에 저장 필드가 없어 전송하지 않음
// (향후 백엔드에서 컬럼/필드 추가 시 mutation body로 함께 전송하도록 수정)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { api, ApiError } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'

type Tier = 'basic' | 'standard' | 'premium'

type Subscription = {
  id: number
  user_id: number
  tier: Tier
  status: 'active' | 'cancelled' | 'expired'
  next_billing_at: string | null
  started_at: string
  cancelled_at: string | null
  pending_tier: Tier | null
}

export default function CancelSubscriptionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [agreed, setAgreed] = useState(false)

  const { data: me, isLoading: meLoading } = useMe()

  // 비로그인 시 useMe가 null → enabled:false로 불필요 호출 차단
  const { data: subscription, isLoading: subLoading } = useQuery<Subscription | null>({
    queryKey: ['subscriptions', 'me'],
    queryFn: () => api.get<Subscription | null>('/api/subscriptions/me'),
    enabled: !!me,
  })

  // 해지 성공 후 캐시 무효화 — /mypage가 ['subscriptions','me']를 다시 fetch해 cancelled 상태 반영
  const cancel = useMutation({
    mutationFn: () => api.patch('/api/subscriptions/cancel'),
    onSuccess: () => {
      toast.success('구독이 해지됐어요.')
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
      router.push('/mypage')
    },
    onError: (e) => {
      // 404 (해지할 active 구독 없음) 등 백엔드 메시지를 그대로 노출
      const msg = e instanceof ApiError ? e.message : '구독 해지에 실패했어요.'
      toast.error(msg)
    },
  })

  if (meLoading || subLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  // proxy.ts가 비로그인 차단해서 사실상 도달 X — 안전망
  if (!me) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-foreground">로그인이 필요해요.</p>
        <Button asChild className="mt-4">
          <Link href="/login">로그인하러 가기</Link>
        </Button>
      </div>
    )
  }

  // 신규 가입자 / 이미 해지한 사용자 — 빈 상태 처리
  if (!subscription) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-foreground">해지할 구독이 없어요.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/pricing">요금제 보러 가기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">가입 해지</h1>

      {/* 주의사항 박스 */}
      <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-semibold">해지 시 주의사항</p>
        </div>
        <ul className="mt-3 space-y-1.5 pl-7 text-sm text-foreground">
          <li className="list-disc">해지 즉시 보상 지급이 중단됩니다</li>
          <li className="list-disc">이미 발생한 트리거에 대한 보상은 지급됩니다</li>
          <li className="list-disc">남은 결제 기간에 대한 환불은 불가능합니다</li>
          <li className="list-disc">재가입 시 신규 가입으로 처리됩니다</li>
        </ul>
      </div>

      {/* 해지 사유 + 동의 */}
      <div className="mt-6 rounded-lg border bg-background p-5">
        <label htmlFor="reason" className="block text-sm font-medium text-foreground">
          해지 사유 <span className="text-muted-foreground">(선택사항)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="서비스 개선을 위해 해지 사유를 알려주세요."
          rows={4}
          className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
          />
          위 주의사항을 확인했으며, 결제 해지에 동의합니다.
        </label>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <Link href="/mypage">취소</Link>
        </Button>
        <Button
          variant="destructive"
          disabled={!agreed || cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          {cancel.isPending ? '해지 중...' : '해지하기'}
        </Button>
      </div>
    </div>
  )
}
