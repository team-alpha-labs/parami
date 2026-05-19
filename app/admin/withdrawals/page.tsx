'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { AdminWithdrawalRow } from '@/lib/queries/admin'
import { Search } from 'lucide-react'

export default function AdminWithdrawalsPage() {
  const [search, setSearch] = useState('')

  const { data: withdrawals = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'withdrawals'],
    queryFn: () => api.get<AdminWithdrawalRow[]>('/api/admin/withdrawals'),
  })

  const filtered = withdrawals.filter((w) =>
    w.user_email.toLowerCase().includes(search.toLowerCase())
  )

  const totalCount = withdrawals.length
  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">출금 내역</h1>
      <p className="text-sm text-muted-foreground mb-6">
        유저의 포인트 출금 내역을 확인하세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">총 출금 건수</p>
          <p className="text-3xl font-bold">
            {totalCount}
            <span className="text-base font-normal text-muted-foreground ml-1">건</span>
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-background px-6 py-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">총 출금액</p>
          <p className="text-3xl font-bold">
            {totalAmount.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        </div>
      </div>

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
                <th className="text-left px-6 py-3 font-medium">출금액</th>
                <th className="text-left px-6 py-3 font-medium">출금일시</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{w.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{w.user_name}</span>
                      <span className="text-xs text-muted-foreground">{w.user_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {w.amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(w.withdrawn_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? '검색 결과가 없습니다.' : '출금 내역이 없습니다.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
