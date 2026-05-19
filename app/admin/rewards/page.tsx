'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { AdminRewardRow } from '@/lib/queries/admin'
import { Search } from 'lucide-react'

const TRIGGER_BADGE: Record<string, { label: string; className: string }> = {
  rain: { label: '강수', className: 'bg-primary/10 text-primary' },
  heat: { label: '폭염', className: 'bg-destructive/10 text-destructive' },
  cold: { label: '한파', className: 'bg-primary/10 text-primary' },
  snow: { label: '눈', className: 'bg-muted text-muted-foreground' },
  dust: { label: '미세먼지', className: 'bg-warning/10 text-warning' },
  good_weather: { label: '맑은 날', className: 'bg-success/10 text-success' },
}

export default function AdminRewardsPage() {
  const [search, setSearch] = useState('')

  const { data: rewards = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'rewards'],
    queryFn: () => api.get<AdminRewardRow[]>('/api/admin/rewards'),
  })

  const filtered = rewards.filter((r) =>
    r.user_email.toLowerCase().includes(search.toLowerCase())
  )

  const totalCount = rewards.length
  const totalAmount = rewards.reduce((sum, r) => sum + r.amount, 0)
  const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">보상 지급 내역</h1>
      <p className="text-sm text-muted-foreground mb-6">
        유저에게 지급된 보상금 내역을 확인하세요.
      </p>

      {/* 통계 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">총 지급 건수</p>
          <p className="text-3xl font-bold">
            {totalCount}
            <span className="text-base font-normal text-muted-foreground ml-1">건</span>
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">총 지급 금액</p>
          <p className="text-3xl font-bold">
            {totalAmount.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">평균 보상금</p>
          <p className="text-3xl font-bold">
            {avgAmount.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        </div>
      </div>

      {/* 검색바 */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 bg-background w-full max-w-lg mb-6">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="이메일 검색..."
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
                <th className="text-left px-6 py-3 font-medium">유저</th>
                <th className="text-left px-6 py-3 font-medium">트리거</th>
                <th className="text-left px-6 py-3 font-medium">보상금</th>
                <th className="text-left px-6 py-3 font-medium">지급일시</th>
                <th className="text-left px-6 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reward) => {
                const badge = TRIGGER_BADGE[reward.trigger_type] ?? {
                  label: reward.trigger_type,
                  className: 'bg-muted text-muted-foreground',
                }
                return (
                  <tr key={reward.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{reward.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{reward.user_name}</span>
                        <span className="text-xs text-muted-foreground">{reward.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-success">
                      +{reward.amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(reward.rewarded_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        완료
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? '검색 결과가 없습니다.' : '보상 지급 내역이 없습니다.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}