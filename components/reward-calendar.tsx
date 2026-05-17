'use client'

// 보상 캘린더 — 월 단위 그리드, 보상 받은 날 표시
// 사용처: /home (이번 달 요약), /rewards (월 이동 가능)
// rewards에 trigger_type이 없어 (reward_logs는 trigger_log_id로만 연결)
// 디자인의 트리거 타입별 색 도트는 후속 작업 — 현재는 일 합계만 표시

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarReward = {
  amount: number
  rewarded_at: string | Date
}

type Props = {
  rewards: CalendarReward[]
  initialYear?: number
  initialMonth?: number // 1~12
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

// react-hooks/purity 룰 우회 — 모듈 레벨 헬퍼로 Date.now 호출 격리
function getKstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

export function RewardCalendar({ rewards, initialYear, initialMonth }: Props) {
  // KST 기준 현재 연/월 (서버 UTC 환경에서도 한국 시각 통일)
  const initial = getKstNow()
  const [year, setYear] = useState(initialYear ?? initial.getUTCFullYear())
  const [month, setMonth] = useState(initialMonth ?? initial.getUTCMonth() + 1)

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // 일자별 보상 합계 맵
  const dailyTotals = new Map<number, number>()
  for (const r of rewards) {
    const d = new Date(r.rewarded_at)
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate()
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + r.amount)
    }
  }
  const monthTotal = [...dailyTotals.values()].reduce((s, v) => s + v, 0)

  const prev = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else setMonth(month - 1)
  }
  const next = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else setMonth(month + 1)
  }

  // 그리드 셀: 앞쪽 빈칸 + 1~daysInMonth
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayKst = getKstNow()
  const isCurrentMonth =
    todayKst.getUTCFullYear() === year && todayKst.getUTCMonth() + 1 === month
  const todayDate = isCurrentMonth ? todayKst.getUTCDate() : -1

  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prev} aria-label="이전 달">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-base font-semibold text-foreground">
          {year}년 {month}월
        </p>
        <Button variant="ghost" size="icon" onClick={next} aria-label="다음 달">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'py-1',
              i === 0 && 'text-destructive',
              i === 6 && 'text-primary',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-14" />
          const amount = dailyTotals.get(day) ?? 0
          const isToday = day === todayDate
          return (
            <div
              key={day}
              className={cn(
                'flex h-14 flex-col items-center justify-center rounded-md text-xs',
                isToday && 'bg-primary/10',
                amount > 0 && !isToday && 'bg-muted/50',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isToday ? 'text-primary' : 'text-foreground',
                )}
              >
                {day}
              </span>
              {amount > 0 && (
                <span className="text-[10px] font-semibold text-primary">
                  +{amount.toLocaleString()}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">
          {month}월 받은 보상 {dailyTotals.size}일
        </span>
        <span className="font-semibold text-foreground">
          합계 {monthTotal.toLocaleString()}원
        </span>
      </div>
    </div>
  )
}
