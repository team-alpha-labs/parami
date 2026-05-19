'use client'

// 클라이언트 사이드 Provider 모음:
// - TanStack Query: 서버 상태 캐싱·재시도·로딩 관리
// - Toaster (sonner): 성공/실패 토스트 알림

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient는 컴포넌트 인스턴스마다 1개씩 (useState로 lazy init)
  // 서버에서 직접 new QueryClient()하면 요청 간 캐시 공유돼 위험
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분간 fresh 처리 (불필요 재요청 방지)
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 재요청 끔 (UX 안정)
            retry: 1, // 실패 시 1회만 재시도
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/*
        sonner 내부 구조: <ol data-sonner-toaster>의 자식 <li data-sonner-toast>가
        position: absolute (node_modules/sonner/dist/styles.css L85).
        ol의 width와 li의 width 둘 다 `var(--width)`를 쓰는데, 둘을 따로 override하면
        ol/li 폭 어긋남 → 화면 좌/우 치우침 발생.
        → 가장 안전: sonner 디폴트 폭(356px) 유지. ol이 left:50% + translateX(-50%)로
          화면 정중앙 정렬되어 박스 위치는 보장됨. 본문만 가운데 정렬.
      */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            title: 'text-center w-full',
          },
        }}
      />
    </QueryClientProvider>
  )
}
