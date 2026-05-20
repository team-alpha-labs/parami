'use client'

// /mypage — 본인 보상/결제/구독 요약 + 이번 달 트리거 현황
// 트리거 현황: /api/rewards/me 결과를 client-side에서 trigger_type별 그루핑
//   (KST 기준 이번 달 reward_year/reward_month로 필터)

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  CloudRain,
  CloudSnow,
  CreditCard,
  Gift,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'
import { api } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WithdrawModal } from '@/components/withdraw-modal'
import { PointsWithdrawModal } from '@/components/points-withdraw-modal'
import { TRIGGER_CONDITIONS } from '@/lib/conditions'
import type { RewardRow, SubscriptionRow, TriggerType } from '@/types/db'

// 트리거 표시 정보 — 시안 순서: 비/폭염/미세먼지 / 맑은 날 보너스/한파/눈
// bg·text 클래스는 Tailwind 정적 검출을 위해 풀 문자열로 (동적 보간 X)
const TRIGGER_DISPLAY: Array<{
  key: TriggerType
  label: string
  icon: typeof CloudRain
  condition: string
  bg: string
  text: string
}> = [
  {
    key: 'rain',
    label: '비',
    icon: CloudRain,
    condition: `강수 ${TRIGGER_CONDITIONS.rain}mm 이상`,
    bg: 'bg-trigger-rain/10',
    text: 'text-trigger-rain',
  },
  {
    key: 'heat',
    label: '폭염',
    icon: Sun,
    condition: `최고 ${TRIGGER_CONDITIONS.heat}℃ 이상`,
    bg: 'bg-trigger-heat/10',
    text: 'text-trigger-heat',
  },
  {
    key: 'dust',
    label: '미세먼지',
    icon: Wind,
    condition: `PM2.5 ${TRIGGER_CONDITIONS.dust} 이상`,
    bg: 'bg-trigger-dust/10',
    text: 'text-trigger-dust',
  },
  {
    key: 'good_weather',
    label: '맑은 날 보너스',
    icon: Sparkles,
    condition: '봄, 가을 적용(강수 1mm 이하, PM30 이하, 풍속 5m/s 이하)',
    bg: 'bg-trigger-good/10',
    text: 'text-trigger-good',
  },
  {
    key: 'cold',
    label: '한파',
    icon: Thermometer,
    condition: `최저 ${TRIGGER_CONDITIONS.cold}℃ 이하`,
    bg: 'bg-trigger-cold/10',
    text: 'text-trigger-cold',
  },
  {
    key: 'snow',
    label: '눈',
    icon: CloudSnow,
    condition: '기상청 기준',
    bg: 'bg-trigger-snow/10',
    text: 'text-trigger-snow',
  },
]

// KST 기준 이번 달
function getKstYearMonth() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 }
}

type RewardSummary = {
  totalCount: number
  totalAmount: number
  thisMonthCount: number
}

type Plan = { tier: 'basic' | 'standard' | 'premium'; price: number; name: string }

const TIER_LABEL: Record<Plan['tier'], string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
}

const STATUS_LABEL: Record<SubscriptionRow['status'], string> = {
  active: '활성',
  cancelled: '해지',
  expired: '만료',
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function MyPage() {
  const { data: me } = useMe()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [pointsWithdrawOpen, setPointsWithdrawOpen] = useState(false)

  const { data: summary } = useQuery<RewardSummary>({
    queryKey: ['rewards', 'summary'],
    queryFn: () => api.get<RewardSummary>('/api/rewards/summary'),
    enabled: !!me,
  })

  const { data: subscription } = useQuery<SubscriptionRow | null>({
    queryKey: ['subscriptions', 'me'],
    queryFn: () => api.get<SubscriptionRow | null>('/api/subscriptions/me'),
    enabled: !!me,
  })

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/api/plans'),
  })

  const { data: rewards } = useQuery<RewardRow[]>({
    queryKey: ['rewards', 'me'],
    queryFn: () => api.get<RewardRow[]>('/api/rewards/me'),
    enabled: !!me,
  })

  const currentPlan = plans?.find((p) => p.tier === subscription?.tier)

  // 이번 달 보상만 trigger_type별 카운트 + 금액 합산 (KST 기준)
  const { year, month } = getKstYearMonth()
  const triggerCounts = (rewards ?? []).reduce<Record<TriggerType, number>>(
    (acc, r) => {
      if (r.reward_year === year && r.reward_month === month) {
        acc[r.trigger_type] = (acc[r.trigger_type] ?? 0) + 1
      }
      return acc
    },
    { rain: 0, heat: 0, cold: 0, snow: 0, dust: 0, good_weather: 0 },
  )
  const thisMonthAmount = (rewards ?? [])
    .filter((r) => r.reward_year === year && r.reward_month === month)
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">마이페이지</h1>
        {subscription && (
          <Link
            href="/cancel-subscription"
            className="text-sm text-destructive hover:underline"
          >
            가입 해지
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 누적 보상 카드 — 큰 숫자는 출금 가능 balance, 통계는 부제로 */}
        <div className="rounded-lg bg-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5" aria-hidden />
              <p className="text-base font-medium opacity-90">누적 보상금</p>
            </div>
            {/* 출금하기 — primary 카드 위라 흰 배경/primary 텍스트. balance < 5만이면 disabled */}
            <Button
              size="sm"
              onClick={() => setPointsWithdrawOpen(true)}
              disabled={!me || me.balance < 50000}
              className="bg-white text-primary hover:bg-white/90 disabled:bg-white/40 disabled:text-primary-foreground"
            >
              출금하기
            </Button>
          </div>
          <p className="mt-3 text-4xl font-bold">
            {(me?.balance ?? 0).toLocaleString()}
            <span className="ml-1 text-base font-normal opacity-90">원</span>
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="opacity-80">이번 달 보상</span>
              <span className="font-semibold">
                {thisMonthAmount.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">총 트리거 횟수</span>
              <span className="font-semibold">
                {(summary?.totalCount ?? 0).toLocaleString()}회
              </span>
            </div>
          </div>
          <Button
            asChild
            className="mt-6 w-full border-transparent bg-white/30 text-primary-foreground hover:bg-white/40"
          >
            <Link href="/rewards">보상 내역 보기</Link>
          </Button>
        </div>

        {/* 결제 정보 카드 */}
        <div className="rounded-lg border border-border/50 bg-background p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-foreground" aria-hidden />
            <p className="text-sm font-semibold text-foreground">결제 정보</p>
          </div>

          {subscription ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">플랜</dt>
                <dd className="font-semibold text-foreground">
                  {TIER_LABEL[subscription.tier]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">상태</dt>
                <dd>
                  <Badge variant={subscription.status === 'active' ? 'success' : 'muted'}>
                    {STATUS_LABEL[subscription.status]}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">가입일</dt>
                <dd className="text-foreground">{formatDate(subscription.started_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">다음 결제일</dt>
                <dd className="text-foreground">{formatDate(subscription.next_billing_at)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3">
                <dt className="text-muted-foreground">월 결제 금액</dt>
                <dd className="font-semibold text-foreground">
                  {currentPlan ? `${currentPlan.price.toLocaleString()}원` : '-'}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-sm text-muted-foreground">구독 중인 플랜이 없어요.</p>
              <Button asChild>
                <Link href="/pricing">요금제 보러 가기</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 이번 달 트리거 현황 — /api/rewards/me 결과를 trigger_type별 그루핑 (KST 이번 달) */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded bg-primary" aria-hidden />
          <h2 className="text-lg font-bold text-foreground md:text-xl">
            이번 달 트리거 현황
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {TRIGGER_DISPLAY.map(({ key, label, icon: Icon, condition, bg, text }) => {
            const count = triggerCounts[key]
            return (
              <div
                key={key}
                className="rounded-lg border border-border/50 bg-background p-4 shadow-sm md:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className={`inline-flex shrink-0 rounded-md p-2 ${bg}`}>
                    <Icon className={`h-5 w-5 ${text}`} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground md:text-base">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {condition}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-2xl font-bold text-foreground md:text-3xl">
                    {count}
                    <span className="ml-0.5 text-base font-normal text-muted-foreground">
                      회
                    </span>
                  </span>
                  <Badge variant={count > 0 ? 'success' : 'muted'}>
                    {count > 0 ? '지급됨' : '대기 중'}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 회원 탈퇴 — 가입 해지(구독 해지)와 별개. 페이지 우측 하단에 위험 액션으로 분리 */}
      <div className="mt-12 flex justify-end">
        <button
          type="button"
          onClick={() => setWithdrawOpen(true)}
          className="text-xs text-muted-foreground hover:text-destructive hover:underline"
        >
          회원 탈퇴
        </button>
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        hasActiveSubscription={subscription?.status === 'active'}
      />

      {me && (
        <PointsWithdrawModal
          open={pointsWithdrawOpen}
          onOpenChange={setPointsWithdrawOpen}
          balance={me.balance}
        />
      )}
    </div>
  )
}
