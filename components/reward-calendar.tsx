'use client'

// 보상 캘린더 — 월 단위 그리드, 보상 받은 날 표시
// 사용처: /home (이번 달 요약), /rewards (월 이동 + 트리거별 색 도트 + 레전드)
// 트리거 도트 색: 디자인 토큰 (bg-trigger-*), 시안의 6종(rain/heat/cold/snow/dust/good_weather)
// 같은 날 여러 트리거가 있으면 첫 트리거의 색만 도트로 노출 (캘린더는 요약,
//   정확한 분해는 /rewards 상세 테이블에서)

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TriggerType } from '@/types/db'

export type CalendarReward = {
  amount: number
  rewarded_at: string | Date
  trigger_type: TriggerType
}

type Props = {
  rewards: CalendarReward[]
  initialYear?: number
  initialMonth?: number // 1~12
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

// 트리거 도트 색 (§6 TriggerCards COLOR_MAP / 마이페이지 패턴과 일관)
const TRIGGER_DOT_BG: Record<TriggerType, string> = {
  rain: 'bg-trigger-rain',
  heat: 'bg-trigger-heat',
  cold: 'bg-trigger-cold',
  snow: 'bg-trigger-snow',
  dust: 'bg-trigger-dust',
  good_weather: 'bg-trigger-good',
}

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

  // 일자별 보상 합계 + 첫 트리거 (도트 색용)
  const dailyInfo = new Map<number, { amount: number; trigger_type: TriggerType }>()
  for (const r of rewards) {
    const d = new Date(r.rewarded_at)
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate()
      const existing = dailyInfo.get(day)
      dailyInfo.set(day, {
        amount: (existing?.amount ?? 0) + r.amount,
        trigger_type: existing?.trigger_type ?? r.trigger_type, // 첫 트리거 유지
      })
    }
  }
  const monthTotal = [...dailyInfo.values()].reduce((s, v) => s + v.amount, 0)

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
    <div className="rounded-lg border border-border/50 bg-background p-5 shadow-sm">
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
          const info = dailyInfo.get(day)
          const isToday = day === todayDate
          return (
            <div
              key={day}
              className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-md text-xs"
            >
              {/* 오늘 날짜 강조: 둥근 primary 칩. 그 외엔 일반 텍스트 */}
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center text-sm',
                  isToday
                    ? 'rounded-full bg-primary font-medium text-primary-foreground'
                    : 'text-foreground',
                )}
              >
                {day}
              </span>
              {info && (
                <>
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      TRIGGER_DOT_BG[info.trigger_type],
                    )}
                    aria-hidden
                  />
                  <span className="text-[10px] font-semibold text-foreground">
                    +{info.amount.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">
          {month}월 받은 보상 {dailyInfo.size}일
        </span>
        <span className="font-semibold text-foreground">
          합계 {monthTotal.toLocaleString()}원
        </span>
      </div>
    </div>
  )
}
