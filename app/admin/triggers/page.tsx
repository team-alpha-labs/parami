'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import {
  CloudRain,
  CloudSnow,
  HelpCircle,
  Search,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'

// 우석이 추가한 필드 포함한 타입
type AdminTriggerRow = {
  id: number
  weather_log_id: number
  trigger_type: 'rain' | 'heat' | 'cold' | 'snow' | 'dust' | 'good_weather'
  triggered_at: Date
  triggered_date: string
  rain_mm: number | null
  temp_c: number | null
  wind_ms: number | null
  pm25: number | null
  affected_users: number | null
  total_reward_amount: number | null
}

// emoji 대신 lucide 아이콘 + 트리거 컬러 토큰 (랜딩 §6 / mypage 트리거 카드와 동일 매핑)
const TRIGGER_LABEL: Record<
  string,
  { icon: typeof CloudRain; name: string; colorClass: string }
> = {
  rain: { icon: CloudRain, name: '강수', colorClass: 'text-trigger-rain' },
  heat: { icon: Sun, name: '폭염', colorClass: 'text-trigger-heat' },
  cold: { icon: Thermometer, name: '한파', colorClass: 'text-trigger-cold' },
  snow: { icon: CloudSnow, name: '눈', colorClass: 'text-trigger-snow' },
  dust: { icon: Wind, name: '미세먼지', colorClass: 'text-trigger-dust' },
  good_weather: {
    icon: Sparkles,
    name: '맑은 날',
    colorClass: 'text-trigger-good',
  },
}

function getMeasuredValue(trigger: AdminTriggerRow) {
  switch (trigger.trigger_type) {
    case 'rain': return trigger.rain_mm != null ? `${trigger.rain_mm}mm` : '—'
    case 'heat': return trigger.temp_c != null ? `${trigger.temp_c}°C` : '—'
    case 'cold': return trigger.temp_c != null ? `${trigger.temp_c}°C` : '—'
    case 'snow': return '관측'
    case 'dust': return trigger.pm25 != null ? `${trigger.pm25}㎍` : '—'
    case 'good_weather': return trigger.wind_ms != null ? `${trigger.wind_ms}m/s` : '—'
    default: return '—'
  }
}

export default function AdminTriggersPage() {
  const [search, setSearch] = useState('')

  const { data: triggers = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'triggers'],
    queryFn: () => api.get<AdminTriggerRow[]>('/api/admin/triggers'),
  })

  const filtered = triggers.filter((t) => {
    const label = TRIGGER_LABEL[t.trigger_type]?.name ?? t.trigger_type
    return label.includes(search)
  })

  const totalCount = triggers.length
  const totalAffectedUsers = triggers.reduce((sum, t) => sum + (t.affected_users ?? 0), 0)
  const totalRewardAmount = triggers.reduce((sum, t) => sum + (t.total_reward_amount ?? 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">트리거 내역</h1>
      <p className="text-sm text-muted-foreground mb-6">
        기상 조건에 따라 발동된 트리거를 확인하세요.
      </p>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">총 트리거 발동</p>
          <p className="text-3xl font-bold">
            {totalCount}
            <span className="text-base font-normal text-muted-foreground ml-1">회</span>
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">영향받은 유저</p>
          <p className="text-3xl font-bold">
            {totalAffectedUsers.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">명</span>
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">총 보상 지급액</p>
          <p className="text-3xl font-bold">
            {totalRewardAmount.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        </div>
      </div>

      {/* 검색바 */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 bg-background w-full max-w-lg mb-6">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="트리거 유형 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">불러오는 중...</div>
      )}
      {error && (
        <div className="text-center py-12 text-destructive text-sm">데이터를 불러오지 못했습니다.</div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-xl border border-border bg-muted/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">트리거 유형</th>
                <th className="text-left px-6 py-3 font-medium">발동 시각</th>
                <th className="text-left px-6 py-3 font-medium">측정값</th>
                <th className="text-left px-6 py-3 font-medium">영향 유저</th>
                <th className="text-left px-6 py-3 font-medium">총 보상금</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trigger) => {
                const label = TRIGGER_LABEL[trigger.trigger_type] ?? {
                  icon: HelpCircle,
                  name: trigger.trigger_type,
                  colorClass: 'text-muted-foreground',
                }
                const Icon = label.icon
                return (
                  <tr key={trigger.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{trigger.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${label.colorClass}`} aria-hidden />
                        <span>{label.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(trigger.triggered_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {getMeasuredValue(trigger)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {trigger.affected_users != null ? `${trigger.affected_users.toLocaleString()}명` : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-success">
                      {trigger.total_reward_amount != null ? `${trigger.total_reward_amount.toLocaleString()}원` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? '검색 결과가 없습니다.' : '트리거 내역이 없습니다.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}