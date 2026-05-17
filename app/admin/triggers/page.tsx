'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { AdminTriggerRow } from '@/lib/queries/admin'
import { Search } from 'lucide-react'

const TRIGGER_LABEL: Record<string, { emoji: string; name: string }> = {
  rain: { emoji: '🌧️', name: '강수' },
  heat: { emoji: '☀️', name: '폭염' },
  cold: { emoji: '🥶', name: '한파' },
  snow: { emoji: '❄️', name: '눈' },
  dust: { emoji: '💨', name: '미세먼지' },
  good_weather: { emoji: '🌤️', name: '맑은 날' },
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">트리거 내역</h1>
      <p className="text-sm text-muted-foreground mb-6">
        기상 조건에 따라 발동된 트리거를 확인하세요.
      </p>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-background rounded-xl border px-6 py-5">
          <p className="text-sm text-muted-foreground mb-1">총 트리거 발동</p>
          <p className="text-3xl font-bold">
            {totalCount}
            <span className="text-base font-normal text-muted-foreground ml-1">회</span>
          </p>
        </div>
        <div className="bg-background rounded-xl border px-6 py-5">
          <p className="text-sm text-muted-foreground mb-1">영향받은 유저</p>
          <p className="text-3xl font-bold text-muted-foreground">—</p>
        </div>
        <div className="bg-background rounded-xl border px-6 py-5">
          <p className="text-sm text-muted-foreground mb-1">총 보상 지급액</p>
          <p className="text-3xl font-bold text-muted-foreground">—</p>
        </div>
      </div>

      {/* 검색바 */}
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background w-full max-w-lg mb-6">
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
        <div className="overflow-x-auto bg-background rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">트리거 유형</th>
                <th className="text-left px-6 py-3 font-medium">발동 시각</th>
                <th className="text-left px-6 py-3 font-medium">측정값</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trigger) => {
                const label = TRIGGER_LABEL[trigger.trigger_type] ?? { emoji: '❓', name: trigger.trigger_type }
                return (
                  <tr key={trigger.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{trigger.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{label.emoji}</span>
                        <span>{label.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(trigger.triggered_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {getMeasuredValue(trigger)}
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