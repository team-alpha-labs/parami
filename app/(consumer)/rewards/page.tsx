'use client'

// /rewards — 본인 보상 내역 (캘린더 + 누적 + 상세 테이블)
// 캘린더는 components/reward-calendar.tsx 재사용 (홈과 동일)
// 디자인의 "트리거 유형 / 상세" 컬럼은 reward_logs에 trigger_type 없어 후속 작업
//   (백엔드에서 trigger_logs / weather_logs JOIN 필요)

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Badge } from '@/components/ui/badge'
import { RewardCalendar, type CalendarReward } from '@/components/reward-calendar'
import type { RewardRow } from '@/types/db'

type RewardSummary = {
  totalCount: number
  totalAmount: number
  thisMonthCount: number
}

const TIER_LABEL: Record<RewardRow['tier_at_reward'], string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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

      {/* 캘린더 */}
      <div className="mt-6">
        <RewardCalendar rewards={calendarRewards} />
      </div>

      {/* 상세 테이블 */}
      <div className="mt-8 rounded-lg border bg-background">
        <div className="border-b px-6 py-4">
          <p className="text-sm font-semibold text-foreground">
            상세 내역{' '}
            <span className="text-muted-foreground">({rewards?.length ?? 0}건)</span>
          </p>
        </div>

        {isLoading ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            불러오는 중...
          </p>
        ) : !rewards || rewards.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            아직 받은 보상이 없어요. 트리거 조건이 충족되면 자동으로 지급돼요.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-6 py-3 text-left font-medium">날짜</th>
                  <th className="px-6 py-3 text-left font-medium">티어</th>
                  <th className="px-6 py-3 text-right font-medium">보상금</th>
                  <th className="px-6 py-3 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="px-6 py-3 text-foreground">
                      {formatDate(r.rewarded_at)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {TIER_LABEL[r.tier_at_reward]}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-primary">
                      +{r.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Badge variant="success">지급완료</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
