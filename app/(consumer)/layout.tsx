// (consumer) 그룹 보호 가드 — invalid/만료/없는 토큰 모두 /login으로 보냄
// proxy.ts는 Edge 런타임이라 jsonwebtoken verify를 못 돌려서 토큰 존재 여부만 체크.
// 실제 verify는 여기 server layout에서 처리.
// 같은 패턴: app/admin/layout.tsx (role='admin' 추가 체크)

import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth-server'

export default async function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <>{children}</>
}
