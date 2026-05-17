'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { AdminUserRow } from '@/lib/queries/admin'
import { Search, Mail } from 'lucide-react'

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

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          불러오는 중...
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-12 text-destructive text-sm">
          데이터를 불러오지 못했습니다.
        </div>
      )}

      {/* 테이블 */}
      {!isLoading && !error && (
        <div className="overflow-x-auto bg-background rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">이메일</th>
                <th className="text-left px-6 py-3 font-medium">이름</th>
                <th className="text-left px-6 py-3 font-medium">누적 보상</th>
                <th className="text-left px-6 py-3 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-4 text-muted-foreground">{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4 font-medium text-primary">
                    {user.balance.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
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