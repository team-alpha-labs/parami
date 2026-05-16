'use client'

// /mypage — 본인 보상/결제/구독 요약
// 디자인의 "이번 달 트리거 현황 5종" 섹션은 trigger_type별 집계 API 필요 — 후속 PR

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SubscriptionRow } from '@/types/db'

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

  const currentPlan = plans?.find((p) => p.tier === subscription?.tier)

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
        {/* 누적 보상 카드 */}
        <div className="rounded-lg bg-primary p-6 text-primary-foreground">
          <p className="text-sm font-medium opacity-90">누적 보상금</p>
          <p className="mt-3 text-4xl font-bold">
            {(summary?.totalAmount ?? 0).toLocaleString()}
            <span className="ml-1 text-base font-normal opacity-90">원</span>
          </p>
          <div className="mt-4 flex gap-4 text-xs opacity-90">
            <span>이번 달 {summary?.thisMonthCount ?? 0}회</span>
            <span>총 {summary?.totalCount ?? 0}회</span>
          </div>
          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link href="/rewards">보상 내역 보기</Link>
          </Button>
        </div>

        {/* 결제 정보 카드 */}
        <div className="rounded-lg border bg-background p-6">
          <p className="text-sm font-semibold text-foreground">결제 정보</p>

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
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">구독 중인 플랜이 없어요.</p>
              <Button asChild className="mt-4">
                <Link href="/pricing">요금제 보러 가기</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
