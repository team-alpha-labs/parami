'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import { Search, Mail } from 'lucide-react'

// 우석이 추가한 필드 포함한 타입
type AdminUserRow = {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  balance: number
  created_at: Date
  tier: 'basic' | 'standard' | 'premium' | null
  status: 'active' | 'cancelled' | 'expired' | null
  cancelled_at: Date | null
}

// 플랜 한글 변환
const TIER_LABEL: Record<string, string> = {
  basic: '베이직',
  standard: '스탠다드',
  premium: '프리미엄',
}

// 상태 배지
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>
  const map: Record<string, { label: string; className: string }> = {
    active: { label: '활성', className: 'bg-success/10 text-success' },
    cancelled: { label: '해지', className: 'bg-muted text-muted-foreground' },
    expired: { label: '만료', className: 'bg-destructive/10 text-destructive' },
  }
  const badge = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  )
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUserRow[]>('/api/admin/users'),
  })

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">유저 목록</h1>
      <p className="text-sm text-muted-foreground mb-6">
        가입된 유저를 검색하고 관리하세요.
      </p>

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
                <th className="text-left px-6 py-3 font-medium">이메일</th>
                <th className="text-left px-6 py-3 font-medium">이름</th>
                <th className="text-left px-6 py-3 font-medium">플랜</th>
                <th className="text-left px-6 py-3 font-medium">상태</th>
                <th className="text-left px-6 py-3 font-medium">가입일</th>
                <th className="text-left px-6 py-3 font-medium">해지일</th>
                <th className="text-left px-6 py-3 font-medium">누적 보상</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">
                    {user.tier ? TIER_LABEL[user.tier] : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {user.cancelled_at
                      ? new Date(user.cancelled_at).toLocaleDateString('ko-KR')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {user.balance.toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? '검색 결과가 없습니다.' : '가입된 유저가 없습니다.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}