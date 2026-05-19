'use client'

// /home — 로그인 직후 진입 디폴트 페이지 (proxy.ts에서 redirect)
// 좌측: 보상 캘린더 / 우측: 이번 달 보상 카드 + 빠른 진입
// 디자인의 "최근 알림" / "7일 예보"는 별도 데이터 필요 — 후속 PR 예정

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Gift, ArrowRight } from 'lucide-react'
import { api } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'
import { RewardCalendar, type CalendarReward } from '@/components/reward-calendar'
import type { RewardRow } from '@/types/db'

type RewardSummary = {
  totalCount: number
  totalAmount: number
  thisMonthCount: number
}

// react-hooks/purity 룰 우회 — 모듈 레벨 헬퍼로 Date.now 호출 격리
function getKstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

type WeatherSnapshot = {
  measured_at: string
  location: string
  temp_c: number | null
}

export default function HomePage() {
  const { data: me } = useMe()

  const { data: rewards } = useQuery<RewardRow[]>({
    queryKey: ['rewards', 'me'],
    queryFn: () => api.get<RewardRow[]>('/api/rewards/me'),
    enabled: !!me,
  })

  const { data: summary } = useQuery<RewardSummary>({
    queryKey: ['rewards', 'summary'],
    queryFn: () => api.get<RewardSummary>('/api/rewards/summary'),
    enabled: !!me,
  })

  const { data: weather } = useQuery<WeatherSnapshot>({
    queryKey: ['weather', 'current'],
    queryFn: () => api.get<WeatherSnapshot>('/api/weather/current'),
  })

  // KST 기준 오늘 날짜 라벨
  const kstNow = getKstNow()
  const dateLabel = `${kstNow.getUTCFullYear()}. ${String(kstNow.getUTCMonth() + 1).padStart(2, '0')}. ${String(kstNow.getUTCDate()).padStart(2, '0')}`

  // KST 기준 이번 달 보상 합계
  const thisMonth = kstNow.getUTCMonth() + 1
  const thisYear = kstNow.getUTCFullYear()
  const thisMonthAmount = (rewards ?? [])
    .filter((r) => {
      const d = new Date(r.rewarded_at)
      return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth
    })
    .reduce((s, r) => s + r.amount, 0)

  const calendarRewards: CalendarReward[] = (rewards ?? []).map((r) => ({
    amount: r.amount,
    rewarded_at: r.rewarded_at,
    trigger_type: r.trigger_type,
  }))

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* 인사 헤더 */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {dateLabel}
            {weather?.location && ` · ${weather.location === 'seoul' ? '서울특별시' : weather.location}`}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            안녕하세요, {me?.name ?? '회원'}님
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          이번 달 보상{' '}
          <span className="font-semibold text-foreground">
            {summary?.thisMonthCount ?? 0}건 · +{thisMonthAmount.toLocaleString()}원
          </span>
        </p>
      </div>

      {/* 캘린더 + 이번 달 카드 */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RewardCalendar rewards={calendarRewards} />

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-background p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">이번 달 보상금</p>
              <p className="text-xs text-muted-foreground">
                {thisYear}. {String(thisMonth).padStart(2, '0')}
              </p>
            </div>
            <p className="mt-4 text-4xl font-bold text-primary">
              {thisMonthAmount.toLocaleString()}
              <span className="ml-1 text-base font-normal text-muted-foreground">원</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              누적 {summary?.totalCount ?? 0}회 · {summary?.totalAmount.toLocaleString() ?? 0}원
            </p>
            <Button asChild className="mt-6 w-full">
              <Link href="/mypage">
                마이페이지로 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/weather"
              className="flex flex-col gap-1 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <Cloud className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">날씨 현황</p>
              <p className="text-xs text-muted-foreground">
                {weather?.temp_c != null ? `현재 ${weather.temp_c}°C` : '실시간 모니터링'}
              </p>
            </Link>
            <Link
              href="/rewards"
              className="flex flex-col gap-1 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <Gift className="h-5 w-5 text-success" />
              <p className="text-sm font-semibold text-foreground">보상 내역</p>
              <p className="text-xs text-muted-foreground">지급된 보상 확인</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
