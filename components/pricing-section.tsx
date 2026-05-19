'use client'

// PricingSection — 요금제 3티어 카드 (공통 컴포넌트)
// 사용처: /pricing 페이지 + 여진의 랜딩(/) 페이지
//
// 로그인 상태에 따른 버튼 분기 (4상태):
//   - 비로그인                   → "선택하기" → /signup
//   - 로그인 + 구독 없음         → "선택하기" → /payment?tier=
//   - 로그인 + 현재 티어         → "현재 이용 중" (disabled)
//   - 로그인 + pending_tier 본인 → "변경 예약됨" (disabled, "다음 결제부터 적용" 배지)
//   - 로그인 + 그 외 다른 티어   → "선택하기" → TierChangeModal 오픈 → 확인 후 mutate
//     (다른 티어 예약 중이어도 활성 — 모달이 덮어쓰기 안내)
//
// 정책: 즉시 변경 X — pending_tier에 예약되고 다음 결제 시점에 적용

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TierChangeModal } from '@/components/tier-change-modal'
import { REWARD_AMOUNT_PER_TRIGGER_BY_TIER } from '@/lib/conditions'
import type { Tier } from '@/lib/rewards'

type Plan = { tier: Tier; price: number }
type MySubscription = {
  tier: Tier
  pending_tier: Tier | null
  next_billing_at: string | null
}

const HIGHLIGHTED_TIER: Tier = 'standard'

// 디자인 라벨 (DB plans.name은 한글이지만 디자인은 영문이라 별도 매핑)
const TIER_LABEL: Record<Tier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
}

// 디자인의 체크리스트 — DB에 features 컬럼 없어 하드코딩
const TIER_FEATURES: Record<Tier, string[]> = {
  basic: ['회당 800원 보상', '월 최대 10회 수령'],
  standard: ['회당 1,400원 보상', '월 최대 10회 수령', 'Standard 전용 이벤트'],
  premium: ['회당 2,300원 보상', '월 최대 10회 수령', 'Premium 전용 이벤트'],
}

// 모든 선택하기 버튼 공통: outline 기본 → hover/group-hover 시 primary 채움
// (hover와 group-hover 둘 다 — 직접 버튼 hover든 카드 hover든 동일하게 동작)
const SELECT_BTN_HOVER =
  'w-full hover:bg-primary hover:text-primary-foreground hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary'

export function PricingSection() {
  const queryClient = useQueryClient()
  const { data: me, isLoading: meLoading } = useMe()

  // 모달 상태 — 클릭한 티어 저장 후 모달 오픈 (즉시 mutate X)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)

  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/api/plans'),
  })

  // 본인 현재 티어 + pending_tier + next_billing_at — 모달의 변경 전/후 비교용
  const { data: mySubscription } = useQuery<MySubscription | null>({
    queryKey: ['subscriptions', 'me'],
    queryFn: () => api.get<MySubscription | null>('/api/subscriptions/me'),
    enabled: !!me,
  })

  const changeTier = useMutation({
    mutationFn: (newTier: Tier) =>
      api.patch('/api/subscriptions/change-tier', { newTier }),
    onSuccess: () => {
      toast.success('티어 변경을 예약했어요. 다음 결제일에 바뀌어요.')
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
      setModalOpen(false)
      setSelectedTier(null)
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : '티어를 변경하지 못했어요.'
      toast.error(msg)
    },
  })

  // 카드 클릭 → 모달 오픈 (selectedTier 저장)
  function handleSelectTier(tier: Tier) {
    setSelectedTier(tier)
    setModalOpen(true)
  }
  // 모달의 "변경하기" 클릭 → mutate (onSuccess에서 모달 닫음)
  function handleConfirmChange() {
    if (selectedTier) changeTier.mutate(selectedTier)
  }

  // 모달에 넘길 가격 — plans 응답에서 매핑
  const priceByTier: Partial<Record<Tier, number>> = {}
  for (const p of plans ?? []) priceByTier[p.tier] = p.price

  if (plansLoading || meLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        요금제를 불러오는 중...
      </div>
    )
  }

  if (plansError || !plans) {
    return (
      <div className="py-16 text-center text-sm text-destructive">
        요금제를 불러오지 못했어요.
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-20 md:py-28">
      <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
        요금제 선택
      </h2>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        내게 맞는 보험 플랜을 선택하세요
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 md:items-stretch">
        {plans.map((plan) => {
          const isHighlighted = plan.tier === HIGHLIGHTED_TIER
          const isCurrent = mySubscription?.tier === plan.tier
          const isPendingForThis = mySubscription?.pending_tier === plan.tier
          const features = TIER_FEATURES[plan.tier]

          return (
            <Card
              key={plan.tier}
              className="group relative flex flex-col border-2 transition duration-300 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  인기
                </span>
              )}

              <CardHeader>
                {/* 예약된 티어 카드에 배지 — 사용자 변경 예약 상태 시각화 */}
                {isPendingForThis && (
                  <span className="mb-2 inline-flex w-fit rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                    다음 결제부터 적용
                  </span>
                )}
                <p className="text-2xl font-bold text-foreground">
                  {TIER_LABEL[plan.tier]}
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {plan.price.toLocaleString()}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    원/월
                  </span>
                </p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between gap-6">
                <ul className="space-y-2 text-sm text-foreground">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {!me ? (
                  <Button asChild variant="outline" className={SELECT_BTN_HOVER}>
                    <Link href="/signup">선택하기</Link>
                  </Button>
                ) : !mySubscription ? (
                  <Button asChild variant="outline" className={SELECT_BTN_HOVER}>
                    <Link href={`/payment?tier=${plan.tier}`}>선택하기</Link>
                  </Button>
                ) : isCurrent ? (
                  <Button disabled variant="secondary" className="w-full">
                    현재 이용 중
                  </Button>
                ) : isPendingForThis ? (
                  <Button disabled variant="secondary" className="w-full">
                    변경 예약됨
                  </Button>
                ) : (
                  // 다른 티어로 예약 있어도 활성 — 모달에서 덮어쓰기 안내
                  <Button
                    onClick={() => handleSelectTier(plan.tier)}
                    disabled={changeTier.isPending}
                    variant="outline"
                    className={SELECT_BTN_HOVER}
                  >
                    선택하기
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 티어 변경 확인 모달 — selectedTier + 현재 구독 정보로 변경 전/후 비교 표시 */}
      {selectedTier && mySubscription && (
        <TierChangeModal
          open={modalOpen}
          onOpenChange={(next) => {
            setModalOpen(next)
            if (!next) setSelectedTier(null)
          }}
          currentTier={mySubscription.tier}
          newTier={selectedTier}
          currentPrice={priceByTier[mySubscription.tier] ?? 0}
          newPrice={priceByTier[selectedTier] ?? 0}
          currentRewardPerTrigger={REWARD_AMOUNT_PER_TRIGGER_BY_TIER[mySubscription.tier]}
          newRewardPerTrigger={REWARD_AMOUNT_PER_TRIGGER_BY_TIER[selectedTier]}
          nextBillingAt={mySubscription.next_billing_at}
          pendingTier={mySubscription.pending_tier}
          onConfirm={handleConfirmChange}
          isPending={changeTier.isPending}
        />
      )}
    </section>
  )
}
