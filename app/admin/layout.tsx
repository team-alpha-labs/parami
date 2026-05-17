// 관리자 영역 공통 레이아웃 (RSC)
// - role='admin' 검증 → 아니면 /login으로 리다이렉트
//   (proxy.ts는 admin 영역에 토큰 존재 여부만 체크 — 실제 role 검증은 여기서)
// - 데스크탑: 좌측 사이드바 + 메인 그리드
// - 모바일: 사이드바를 메인 위 가로 nav로 노출 (admin은 데스크탑 우선)

import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth-server'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session || session.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row">
      <AdminSidebar />
      <div className="flex-1">{children}</div>
    </div>
  )
}
