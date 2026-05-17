'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { AdminPaymentRow } from '@/lib/queries/admin'
import { Search } from 'lucide-react'

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => api.get<AdminPaymentRow[]>('/api/admin/payments'),
  })

  const filtered = payments.filter((p) =>
    p.user_email.toLowerCase().includes(search.toLowerCase())
  )

  const totalCount = payments.length
  const totalAmount = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0)
  const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">결제 내역</h1>
      <p className="text-sm text-muted-foreground mb-6">
        유저의 결제 내역과 매출을 확인하세요.
      </p>

      {/* 통계 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-background rounded-xl border px-6 py-5">
          <p className="text-sm text-muted-foreground mb-1">총 결제 건수</p>
          <p className="text-3xl font-bold">
            {totalCount}
            <span className="text-base font-normal text-muted-foreground ml-1">건</span>
          </p>
        </div>
        <div className="bg-background rounded-xl border px-6 py-5">
          <p className="text-sm text-muted-foreground mb-1">총 매출</p>
          <p className="text-3xl font-bold">
            {totalAmount.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        </div>
        <div className="bg-background rounded-xl border px-6 py-5">
          <p className="text-sm text-muted-foreground mb-1">평균 결제액</p>
          <p className="text-3xl font-bold">
            {avgAmount.toLocaleString()}
            <span className="text-base font-normal text-muted-foreground ml-1">원</span>
          </p>
        </div>
      </div>

      {/* 검색바 */}
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background w-full max-w-lg mb-6">
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
        <div className="overflow-x-auto bg-background rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">유저</th>
                <th className="text-left px-6 py-3 font-medium">결제액</th>
                <th className="text-left px-6 py-3 font-medium">결제수단</th>
                <th className="text-left px-6 py-3 font-medium">결제일시</th>
                <th className="text-left px-6 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{payment.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.user_name}</span>
                      <span className="text-xs text-muted-foreground">{payment.user_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {payment.amount.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{payment.method}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(payment.paid_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${payment.status === 'success'
                        ? 'bg-success/10 text-success'
                        : payment.status === 'fail'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                      {payment.status === 'success' ? '완료' : payment.status === 'fail' ? '실패' : '취소'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? '검색 결과가 없습니다.' : '결제 내역이 없습니다.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}