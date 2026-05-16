'use client'

// PricingSection — 요금제 3티어 카드 (공통 컴포넌트)
// 사용처: /pricing 페이지 + 여진의 랜딩(/) 페이지에서도 import
//
// 로그인 상태에 따른 버튼 분기:
//   - 비로그인           → "가입하기" → /signup
//   - 로그인 + 현재 티어 → "현재 이용 중" (disabled)
//   - 로그인 + 다른 티어 → "이 티어로 변경" → PATCH /api/subscriptions/change-tier
//     (즉시 변경 X — pending_tier에 예약되고 다음 결제 시점에 적용)

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tier = 'basic' | 'standard' | 'premium'

type Plan = {
  id: number
  tier: Tier
  name: string
  price: number
  description: string | null
}

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

const HIGHLIGHTED_TIER: Tier = 'standard'

export function PricingSection() {
  const queryClient = useQueryClient()
  const { data: me, isLoading: meLoading } = useMe()

  // plans는 비로그인도 표시해야 하므로 항상 fetch (랜딩에서도 사용)
  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/api/plans'),
  })

  // 현재 티어 강조를 위해 본인 구독 조회 — 로그인 시에만 (enabled로 비로그인 호출 차단)
  const { data: mySubscription } = useQuery<Subscription | null>({
    queryKey: ['subscriptions', 'me'],
    queryFn: () => api.get<Subscription | null>('/api/subscriptions/me'),
    enabled: !!me,
  })

  // 티어 변경 성공 시 ['subscriptions','me'] 캐시 무효화 → "현재 이용 중" 표시 갱신
  // 단, change-tier는 즉시 tier가 아닌 pending_tier만 바꾸므로 카드 강조 즉시 변경 X
  // (다음 결제 시점에 tier가 반영되며 그때 캐시가 자연스럽게 새 상태 받아옴)
  const changeTier = useMutation({
    mutationFn: (newTier: Tier) =>
      api.patch('/api/subscriptions/change-tier', { newTier }),
    onSuccess: () => {
      toast.success('티어 변경이 예약됐어요. 다음 결제 시점에 적용됩니다.')
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
    },
    onError: (e) => {
      // 400 (같은 티어), 404 (active 없음) 등 백엔드 메시지를 그대로 노출
      const msg = e instanceof ApiError ? e.message : '티어 변경에 실패했어요.'
      toast.error(msg)
    },
  })

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
    <section className="mx-auto w-full max-w-5xl px-6 py-12">
      <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
        요금제 선택
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        매월 결제하고 악천후마다 자동으로 보상금을 받아보세요
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 md:items-stretch">
        {plans.map((plan) => {
          const isHighlighted = plan.tier === HIGHLIGHTED_TIER
          const isCurrent = mySubscription?.tier === plan.tier
          // 동시에 여러 티어 버튼을 눌렀을 때 클릭한 카드만 "변경 중..." 표시되도록
          // variables(가장 최근 mutate에 넘긴 값)와 이 카드의 tier가 같을 때만 true
          const isPending =
            changeTier.isPending && changeTier.variables === plan.tier

          return (
            <Card
              key={plan.tier}
              className={cn(
                'flex flex-col',
                isHighlighted && 'border-primary border-2 shadow-md',
              )}
            >
              <CardHeader className="text-center">
                {isHighlighted && (
                  <span className="mx-auto mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    가장 인기
                  </span>
                )}
                <p className="text-sm font-medium text-muted-foreground">
                  {plan.name}
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {plan.price.toLocaleString()}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    원/월
                  </span>
                </p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between gap-6">
                {plan.description && (
                  <p className="text-center text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}

                {!me ? (
                  <Button
                    asChild
                    variant={isHighlighted ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link href="/signup">가입하기</Link>
                  </Button>
                ) : isCurrent ? (
                  <Button disabled variant="secondary" className="w-full">
                    현재 이용 중
                  </Button>
                ) : (
                  <Button
                    onClick={() => changeTier.mutate(plan.tier)}
                    disabled={changeTier.isPending}
                    variant={isHighlighted ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {isPending ? '변경 중...' : '이 티어로 변경'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
