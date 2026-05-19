'use client'

// /rewards — 본인 보상 내역 (캘린더 + 누적 + 상세 테이블)
// 캘린더는 components/reward-calendar.tsx 재사용 (홈과 동일)
// 트리거 유형 색/라벨/조건은 §6 TriggerCards COLOR_MAP / 마이페이지 패턴과 일관
// '상세' 컬럼은 lib/conditions.ts 임계값 텍스트 — 실측정값은 후속 PR (weather_logs JOIN)

import { useQuery } from '@tanstack/react-query'
import {
  CloudRain,
  CloudSnow,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'
import { api } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Badge } from '@/components/ui/badge'
import { RewardCalendar, type CalendarReward } from '@/components/reward-calendar'
import { TRIGGER_CONDITIONS } from '@/lib/conditions'
import { cn } from '@/lib/utils'
import type { RewardRow, TriggerType } from '@/types/db'

type RewardSummary = {
  totalCount: number
  totalAmount: number
  thisMonthCount: number
}

// 트리거 메타 — 라벨/조건 텍스트/아이콘/도트 색
// 마이페이지 TRIGGER_DISPLAY와 동일한 패턴 (lib로 빼면 우석 영역 침범이라 페이지 로컬에 둠)
const TRIGGER_META: Record<
  TriggerType,
  { label: string; condition: string; Icon: typeof CloudRain; dotBg: string; iconColor: string }
> = {
  rain: {
    label: '비',
    condition: `강수 ${TRIGGER_CONDITIONS.rain}mm 이상`,
    Icon: CloudRain,
    dotBg: 'bg-trigger-rain',
    iconColor: 'text-trigger-rain',
  },
  heat: {
    label: '폭염',
    condition: `최고 ${TRIGGER_CONDITIONS.heat}℃ 이상`,
    Icon: Sun,
    dotBg: 'bg-trigger-heat',
    iconColor: 'text-trigger-heat',
  },
  cold: {
    label: '한파',
    condition: `최저 ${TRIGGER_CONDITIONS.cold}℃ 이하`,
    Icon: Thermometer,
    dotBg: 'bg-trigger-cold',
    iconColor: 'text-trigger-cold',
  },
  snow: {
    label: '눈',
    condition: '기상청 기준 눈 관측',
    Icon: CloudSnow,
    dotBg: 'bg-trigger-snow',
    iconColor: 'text-trigger-snow',
  },
  dust: {
    label: '미세먼지',
    condition: `PM2.5 ${TRIGGER_CONDITIONS.dust} 이상`,
    Icon: Wind,
    dotBg: 'bg-trigger-dust',
    iconColor: 'text-trigger-dust',
  },
  good_weather: {
    label: '맑은 날',
    condition: '봄·가을 맑은 날 보너스',
    Icon: Sparkles,
    dotBg: 'bg-trigger-good',
    iconColor: 'text-trigger-good',
  },
}

// 레전드 표시 순서 — 시안 매칭 (캘린더 도트 색 안내)
const LEGEND_ORDER: TriggerType[] = ['rain', 'heat', 'cold', 'snow', 'dust', 'good_weather']

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  })
}

function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Seoul',
  })
}

export default function RewardsPage() {
  const { data: me } = useMe()

  const { data: rewards, isLoading } = useQuery<RewardRow[]>({
    queryKey: ['rewards', 'me'],
    queryFn: () => api.get<RewardRow[]>('/api/rewards/me'),
    enabled: !!me,
  })

  const { data: summary } = useQuery<RewardSummary>({
    queryKey: ['rewards', 'summary'],
    queryFn: () => api.get<RewardSummary>('/api/rewards/summary'),
    enabled: !!me,
  })

  const calendarRewards: CalendarReward[] = (rewards ?? []).map((r) => ({
    amount: r.amount,
    rewarded_at: r.rewarded_at,
    trigger_type: r.trigger_type,
  }))

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">보상 내역</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            날씨 조건에 따른 자동 보상 지급 내역
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">총 보상금</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {(summary?.totalAmount ?? 0).toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 레전드 — 캘린더 도트 색 안내 */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {LEGEND_ORDER.map((t) => {
          const meta = TRIGGER_META[t]
          return (
            <span key={t} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', meta.dotBg)} aria-hidden />
              <span className="text-muted-foreground">{meta.label}</span>
            </span>
          )
        })}
      </div>

      {/* 캘린더 */}
      <div className="mt-3">
        <RewardCalendar rewards={calendarRewards} />
      </div>

      {/* 상세 테이블 */}
      <div className="mt-8 rounded-lg border border-border/50 bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1 rounded bg-primary" aria-hidden />
          <h2 className="text-lg font-bold text-foreground">
            상세 내역{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({rewards?.length ?? 0}건)
            </span>
          </h2>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            불러오는 중...
          </p>
        ) : !rewards || rewards.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            아직 받은 보상이 없어요. 트리거 조건이 충족되면 자동으로 지급돼요.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-3 text-left font-medium">날짜</th>
                  <th className="py-3 text-left font-medium">트리거 유형</th>
                  <th className="py-3 text-left font-medium">상세</th>
                  <th className="py-3 text-right font-medium">보상금</th>
                  <th className="py-3 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((r) => {
                  const meta = TRIGGER_META[r.trigger_type]
                  const Icon = meta.Icon
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-3 text-foreground">
                        <div>{formatDate(r.rewarded_at)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(r.rewarded_at)}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', meta.iconColor)} aria-hidden />
                          <span className="text-foreground">{meta.label}</span>
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{meta.condition}</td>
                      <td className="py-3 text-right font-semibold text-primary">
                        +{r.amount.toLocaleString()}원
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant="success">지급완료</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
