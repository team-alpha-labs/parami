'use client'

// 요금제 변경 확인 모달 — PATCH /api/subscriptions/change-tier 호출 전 확인 단계
// 사용처: components/pricing-section.tsx (controlled 형태)
//
// 정책: 즉시 변경 X — 다음 결제일에 새 티어 적용 (pending_tier로 예약)
// 카피·박스 톤은 WithdrawModal과 일관 (info: primary 톤 / warning: warning 토큰)

import { useState } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Tier } from '@/lib/rewards'

const TIER_LABEL: Record<Tier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTier: Tier
  newTier: Tier
  currentPrice: number              // 월 결제 금액
  newPrice: number
  currentRewardPerTrigger: number   // 회당 보상금
  newRewardPerTrigger: number
  nextBillingAt: Date | string | null
  // 다른 티어로 이미 예약된 상태면 덮어쓰기 안내 박스 노출
  pendingTier?: Tier | null
  onConfirm: () => void
  isPending?: boolean
}

export function TierChangeModal({
  open,
  onOpenChange,
  currentTier,
  newTier,
  currentPrice,
  newPrice,
  currentRewardPerTrigger,
  newRewardPerTrigger,
  nextBillingAt,
  pendingTier,
  onConfirm,
  isPending,
}: Props) {
  const [agreed, setAgreed] = useState(false)

  // 닫을 때 상태 리셋 (재진입 시 체크박스 초기화)
  const handleOpenChange = (next: boolean) => {
    if (!next) setAgreed(false)
    onOpenChange(next)
  }

  // 기존 예약과 다른 티어로 변경 시도 시 덮어쓰기 안내
  const isOverwrite = pendingTier != null && pendingTier !== newTier

  const nextBillingLabel = nextBillingAt
    ? new Date(nextBillingAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Seoul',
      })
    : '다음 결제일'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>요금제 바꾸기</DialogTitle>
          <DialogDescription>내용을 확인해 보세요.</DialogDescription>
        </DialogHeader>

        {/* 이렇게 바뀌어요 — info 톤 (primary) */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-primary">
            <Info className="h-5 w-5" />
            <p>이렇게 바뀌어요</p>
          </div>
          <ul className="space-y-1.5 text-foreground">
            <li className="flex justify-between">
              <span className="text-muted-foreground">요금제</span>
              <span className="font-medium">
                {TIER_LABEL[currentTier]} → {TIER_LABEL[newTier]}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">월 결제 금액</span>
              <span className="font-medium">
                {currentPrice.toLocaleString()}원 → {newPrice.toLocaleString()}원
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">회당 보상금</span>
              <span className="font-medium">
                {currentRewardPerTrigger.toLocaleString()}원 →{' '}
                {newRewardPerTrigger.toLocaleString()}원
              </span>
            </li>
          </ul>
        </div>

        {/* 언제부터 적용되나요 — warning 톤 */}
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-warning">
            <AlertCircle className="h-5 w-5" />
            <p>언제부터 적용되나요?</p>
          </div>
          <ul className="space-y-1 pl-7 text-foreground">
            <li className="list-disc">
              다음 결제일({nextBillingLabel})부터 새 요금제로 바뀌어요
            </li>
            <li className="list-disc">
              이번 달까지는 {TIER_LABEL[currentTier]} 보상금 그대로예요
            </li>
            <li className="list-disc">환불이나 추가 결제는 없어요</li>
          </ul>
        </div>

        {/* 기존 예약 덮어쓰기 안내 — pending_tier가 newTier와 다를 때만 */}
        {isOverwrite && pendingTier && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold text-warning">
              <AlertCircle className="h-5 w-5" />
              <p>기존 예약은 어떻게 되나요?</p>
            </div>
            <p className="pl-7 text-foreground">
              지금 <strong>{TIER_LABEL[pendingTier]}</strong>로 바뀌기로 예약돼 있어요.
              새로 바꾸면 <strong>{TIER_LABEL[newTier]}</strong>로 덮어 써져요.
            </p>
          </div>
        )}

        {/* 동의 체크박스 — native input (WithdrawModal 패턴) */}
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
            disabled={isPending}
          >
            돌아가기
          </Button>
          <Button onClick={onConfirm} disabled={!agreed || isPending}>
            {isPending ? '바꾸는 중...' : '바꾸기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
