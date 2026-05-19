'use client'

// /home — 로그인 직후 진입 디폴트 페이지
// 시안 2 레이아웃:
//   [grid-cols-2] 캘린더 | 이번 달 보상금 + [날씨/보상] 2분할
//   [전폭]               최근 알림
//   [전폭]               7일 예보 (lucide 아이콘 + trigger 토큰 색)
// 박스 외곽선/그림자: border-border/50 + shadow-sm (마이페이지 표준 일관)

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Cloud,
  CloudRain,
  CloudSun,
  Gift,
  Info,
  Sun,
} from 'lucide-react'
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

type WeatherSnapshot = {
  measured_at: string
  location: string
  temp_c: number | null
}

const MAX_REWARD_PER_MONTH = 10

function getKstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

// 더미 알림 데이터 (API 연동 전)
const DUMMY_ALERTS = [
  {
    id: 1,
    type: 'reward' as const,
    title: '집중호우 트리거 · 보상 입금',
    desc: '강수량 62mm / 3시간 · 자동으로 입금됐어요.',
    time: '3일 전',
  },
  {
    id: 2,
    type: 'reward' as const,
    title: '폭염 트리거 · 보상 입금',
    desc: '체감 36°C / 4시간 지속 조건 충족.',
    time: '6일 전',
  },
  {
    id: 3,
    type: 'warning' as const,
    title: '내일 호우 주의보 예보',
    desc: '오후 ~ 저녁 시간대 강수 60mm 예상. 트리거 가능성 높음.',
    time: '오늘',
  },
  {
    id: 4,
    type: 'info' as const,
    title: '5월 정기 결제 예정',
    desc: '6/14 · 20,600원',
    time: '29일 후',
  },
]

// 더미 7일 예보 — lucide 아이콘 + trigger 토큰 색 (마이페이지/날씨 페이지 일관)
// icon은 lucide 컴포넌트 직접 참조 (이모지 X)
const DUMMY_FORECAST = [
  { day: '오늘', Icon: Sun, iconColor: 'text-trigger-heat', temp: 21, trigger: true },
  { day: '금', Icon: CloudRain, iconColor: 'text-trigger-rain', temp: 18, trigger: true },
  { day: '토', Icon: CloudSun, iconColor: 'text-muted-foreground', temp: 20, trigger: false },
  { day: '일', Icon: Sun, iconColor: 'text-trigger-heat', temp: 24, trigger: false },
  { day: '월', Icon: Sun, iconColor: 'text-trigger-heat', temp: 27, trigger: false },
  { day: '화', Icon: Sun, iconColor: 'text-trigger-heat', temp: 31, trigger: false },
  { day: '수', Icon: CloudSun, iconColor: 'text-muted-foreground', temp: 26, trigger: false },
]

// 박스 표준 클래스 (마이페이지 표준과 일관)
const BOX = 'rounded-lg border border-border/50 bg-background p-6 shadow-sm'

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

  const kstNow = getKstNow()
  const dateLabel = `${kstNow.getUTCFullYear()}. ${String(kstNow.getUTCMonth() + 1).padStart(2, '0')}. ${String(kstNow.getUTCDate()).padStart(2, '0')}`
  const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][kstNow.getUTCDay()]

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

  const thisMonthCount = summary?.thisMonthCount ?? 0
  const progressPct = Math.min((thisMonthCount / MAX_REWARD_PER_MONTH) * 100, 100)

  const triggerPossibleDays = DUMMY_FORECAST.filter((d) => d.trigger).length

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      {/* 인사 헤더 */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {dateLabel} · {dayLabel}요일
            {weather?.location && ` · ${weather.location === 'seoul' ? '서울특별시' : weather.location}`}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            안녕하세요, {me?.name ?? '회원'}님
          </h1>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            오늘 활성 트리거 모니터링{' '}
            <Link href="/weather" className="font-semibold text-primary underline">
              {triggerPossibleDays}개
            </Link>
          </p>
          <p>
            이번 달 보상{' '}
            <span className="font-semibold text-foreground">
              {thisMonthCount}건 · +{thisMonthAmount.toLocaleString()}원
            </span>
          </p>
        </div>
      </div>

      {/* 상단: 캘린더 | (이번 달 보상금 + 바로가기 2분할) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RewardCalendar rewards={calendarRewards} />

        <div className="flex flex-col gap-6">
          {/* 이번 달 보상금 박스 */}
          <div className={BOX}>
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
            <p className="mt-1 text-xs text-muted-foreground">
              누적 {summary?.totalCount ?? 0}회 · {(summary?.totalAmount ?? 0).toLocaleString()}원
            </p>

            {/* 월 한도 진행도 */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>월 한도 진행도</span>
                <span>
                  {thisMonthCount} / {MAX_REWARD_PER_MONTH}회
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {thisMonthAmount.toLocaleString()}원
              </p>
            </div>

            <Button asChild className="mt-6 w-full">
              <Link href="/mypage">
                마이페이지로 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* 바로가기 — 2분할 가로 (이번 달 보상금 박스 아래) */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/weather"
              className={`${BOX} flex flex-col gap-1 transition-colors hover:bg-muted/50`}
            >
              <Cloud className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">날씨 현황</p>
              <p className="text-xs text-muted-foreground">
                {weather?.temp_c != null ? `현재 ${weather.temp_c}°C` : '실시간 모니터링'}
              </p>
            </Link>
            <Link
              href="/rewards"
              className={`${BOX} flex flex-col gap-1 transition-colors hover:bg-muted/50`}
            >
              <Gift className="h-5 w-5 text-success" />
              <p className="text-sm font-semibold text-foreground">보상 내역</p>
              <p className="text-xs text-muted-foreground">지급된 보상 확인</p>
            </Link>
          </div>
        </div>
      </div>

      {/* 최근 알림 (전폭) — 관리자 테이블 톤(bg-muted/20 hover)과 일관되게 살짝 회색 */}
      <div className="rounded-lg border border-border/50 bg-muted/30 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">최근 알림</p>
          <Link href="/rewards" className="text-xs text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-border/40">
          {DUMMY_ALERTS.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 py-3">
              <div className="mt-0.5 shrink-0">
                {alert.type === 'reward' && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                {alert.type === 'warning' && (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
                {alert.type === 'info' && (
                  <Info className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.desc}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7일 예보 (전폭) — lucide 아이콘 + trigger 토큰 색 */}
      <div className={BOX}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            7일 예보 · 서울특별시
          </p>
          <span className="text-xs text-primary">
            트리거 가능 {triggerPossibleDays}일
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DUMMY_FORECAST.map((d) => {
            const Icon = d.Icon
            return (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <p
                  className={`text-xs font-medium ${
                    d.day === '오늘' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {d.day}
                </p>
                <Icon className={`h-6 w-6 ${d.iconColor}`} aria-hidden />
                <p className="text-xs text-foreground">{d.temp}°</p>
                {d.trigger && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          파란 점은 트리거 가능성이 높은 날이에요. 기상청 단기예보 기준 자동 계산.
        </p>
      </div>
    </div>
  )
}
