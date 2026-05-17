'use client'

// /admin/dashboard — 관리자 대시보드
// - 상단: 통계 카드 4개 (누적 수치 + 전월 대비 %)
// - 하단: 최근 활동 (4개 테이블 UNION) + 구독 분포 (티어별 active)
// 모든 데이터는 GET /api/admin/dashboard-stats 한 번으로
// role='admin' 가드는 app/admin/layout.tsx에서 처리됨

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  CreditCard,
  Gift,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/client'
import { cn } from '@/lib/utils'

type DashboardData = {
  totals: {
    users: number
    activeSubscriptions: number
    rewardAmount: number
    thisMonthRevenue: number
  }
  changes: {
    users: number | null
    activeSubscriptions: number | null
    rewardAmount: number | null
    revenue: number | null
  }
  recent: Array<{
    type: 'signup' | 'payment' | 'reward' | 'trigger'
    email: string | null
    name: string | null
    amount: number | null
    trigger_type: string | null
    at: string
  }>
  distribution: Array<{
    tier: 'basic' | 'standard' | 'premium'
    count: number
  }>
}

const TIER_LABEL: Record<'basic' | 'standard' | 'premium', string> = {
  basic: '베이직',
  standard: '스탠다드',
  premium: '프리미엄',
}

const TRIGGER_LABEL: Record<string, string> = {
  rain: '강수',
  heat: '폭염',
  cold: '한파',
  snow: '눈',
  dust: '미세먼지',
  good_weather: '맑은 날',
}

// 상대 시간 ("5분 전" 형식). 1시간 이상이면 일자 표시
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: () => api.get<DashboardData>('/api/admin/dashboard-stats'),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">관리자 대시보드</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        서비스 운영 현황을 한눈에 확인하세요.
      </p>

      {isLoading && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      )}

      {error && (
        <div className="mt-8 text-center text-sm text-destructive">
          대시보드를 불러오지 못했어요.
        </div>
      )}

      {data && (
        <>
          {/* 통계 카드 4개 */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="총 유저수"
              value={data.totals.users.toLocaleString()}
              unit="명"
              change={data.changes.users}
            />
            <StatCard
              icon={CreditCard}
              label="활성 구독"
              value={data.totals.activeSubscriptions.toLocaleString()}
              unit="건"
              change={data.changes.activeSubscriptions}
            />
            <StatCard
              icon={Gift}
              label="총 보상 지급액"
              value={data.totals.rewardAmount.toLocaleString()}
              unit="원"
              change={data.changes.rewardAmount}
            />
            <StatCard
              icon={TrendingUp}
              label="이번 달 매출"
              value={data.totals.thisMonthRevenue.toLocaleString()}
              unit="원"
              change={data.changes.revenue}
            />
          </div>

          {/* 최근 활동 + 구독 분포 */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 최근 활동 */}
            <div className="rounded-lg border bg-background p-6">
              <p className="text-sm font-semibold text-foreground">최근 활동</p>

              {data.recent.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  아직 활동이 없어요.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.recent.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <ActivityDot type={r.type} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-foreground">
                          {renderActivity(r)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(r.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 구독 분포 */}
            <div className="rounded-lg border bg-background p-6">
              <p className="text-sm font-semibold text-foreground">구독 분포</p>

              {data.distribution.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  활성 구독이 없어요.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {(['basic', 'standard', 'premium'] as const).map((tier) => {
                    const row = data.distribution.find((d) => d.tier === tier)
                    const count = row?.count ?? 0
                    const total = data.distribution.reduce(
                      (s, d) => s + d.count,
                      0,
                    )
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={tier} className="flex items-center gap-3 text-sm">
                        <span className="w-16 shrink-0 text-foreground">
                          {TIER_LABEL[tier]}
                        </span>
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-24 shrink-0 text-right text-muted-foreground">
                          {count}명 {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 통계 카드
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  change,
}: {
  icon: typeof Users
  label: string
  value: string
  unit: string
  change: number | null
}) {
  const positive = change != null && change >= 0

  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">
        {value}
        <span className="ml-1 text-base font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
      <div className="mt-2 text-xs">
        {change == null ? (
          <span className="text-muted-foreground">전월 데이터 없음</span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              positive ? 'text-success' : 'text-destructive',
            )}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {positive ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
    </div>
  )
}

function ActivityDot({ type }: { type: 'signup' | 'payment' | 'reward' | 'trigger' }) {
  const config = {
    signup: { Icon: UserPlus, color: 'text-muted-foreground' },
    payment: { Icon: CreditCard, color: 'text-primary' },
    reward: { Icon: Gift, color: 'text-success' },
    trigger: { Icon: Zap, color: 'text-warning' },
  }[type]
  const { Icon, color } = config

  return (
    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center', color)}>
      <Icon className="h-4 w-4" />
    </span>
  )
}

function renderActivity(r: DashboardData['recent'][number]): string {
  const who = r.name ?? r.email ?? '익명'
  switch (r.type) {
    case 'signup':
      return `${who} 회원가입`
    case 'payment':
      return `${who} 결제 ${(r.amount ?? 0).toLocaleString()}원`
    case 'reward':
      return `${who} 보상 지급 ${(r.amount ?? 0).toLocaleString()}원`
    case 'trigger': {
      const label = r.trigger_type ? TRIGGER_LABEL[r.trigger_type] ?? r.trigger_type : '트리거'
      return `${label} 트리거 발동`
    }
  }
}
