'use client'

// 현재 로그인 유저 정보 훅 (클라이언트 컴포넌트용)
// 비로그인 시 401 → data === null
// 로그인 시 data === Me

import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/client'

export type Me = {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  // 보상금 잔액 (KRW) — 출금 가능 금액. /api/rewards/withdraw 호출 시 한도 검증에 사용
  balance: number
}

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.get<Me>('/api/auth/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
