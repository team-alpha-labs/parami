'use client'

// PricingSection — 요금제 3티어 카드 (공통 컴포넌트)
// 사용처: /pricing 페이지 + 여진의 랜딩(/) 페이지에서도 import
//
// 데이터 소스:
//   - 가격/티어 키: GET /api/plans (DB plans 테이블)
//   - features 체크리스트: 프론트 하드코딩 (TIER_FEATURES) — DB에 컬럼 없음
//     (향후 plans 테이블에 JSON features 컬럼 추가 시 백엔드 응답으로 대체)
//   - 표시명: tier 코드를 영문 라벨로 매핑 (디자인이 Basic/Standard/Premium 영문이라 DB name 무시)
//
// 로그인 상태에 따른 버튼 분기:
//   - 비로그인           → "선택하기" → /signup
//   - 로그인 + 현재 티어 → "현재 이용 중" (disabled)
//   - 로그인 + 다른 티어 → "선택하기" → PATCH /api/subscriptions/change-tier
//     (즉시 변경 X — pending_tier에 예약되고 다음 결제 시점에 적용)

import Link from 'next/link'
import { Check } from 'lucide-react'
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

// 디자인 라벨 (DB plans.name은 한글이지만 디자인은 영문이라 분리)
const TIER_LABEL: Record<Tier, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
}

// 티어별 features 체크리스트 — 디자인 그대로 (룰렛 관련 문구는 향후 도입 시 추가)
// 향후 DB plans 테이블에 JSON features 컬럼 추가되면 이 상수 제거하고 plan.features 사용
const TIER_FEATURES: Record<Tier, string[]> = {
  basic: ['회당 800원 보상', '월 최대 10회 수령'],
  standard: ['회당 1,400원 보상', '월 최대 10회 수령', 'Standard 전용 이벤트'],
  premium: ['회당 2,300원 보상', '월 최대 10회 수령', 'Premium 전용 이벤트'],
}

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
          // 동시에 여러 티어 버튼을 눌렀을 때 클릭한 카드만 "변경 중..." 표시되도록
          // variables(가장 최근 mutate에 넘긴 값)와 이 카드의 tier가 같을 때만 true
          const isPending =
            changeTier.isPending && changeTier.variables === plan.tier
          const features = TIER_FEATURES[plan.tier]

          return (
            <Card
              key={plan.tier}
              className={cn(
                'relative flex flex-col',
                isHighlighted && 'border-primary border-2 shadow-md',
              )}
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  인기
                </span>
              )}

              <CardHeader>
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
                  <Button
                    asChild
                    variant={isHighlighted ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link href="/signup">선택하기</Link>
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
                    {isPending ? '변경 중...' : '선택하기'}
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
