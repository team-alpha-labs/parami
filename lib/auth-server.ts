// 서버 컴포넌트 / 서버 액션에서 세션 조회
// (lib/auth.ts의 getSession은 API 라우트의 NextRequest 컨텍스트용 —
//  이건 next/headers cookies() 기반으로 서버 컴포넌트에서 호출 가능)

import { cookies } from 'next/headers'
import { verifyToken, type Session } from '@/lib/auth'

export async function getServerSession(): Promise<Session | null> {
  const token = (await cookies()).get('token')?.value
  if (!token) return null
  try {
    const payload = verifyToken(token)
    if (typeof payload === 'string' || typeof payload.uid !== 'number') return null
    return payload as Session
  } catch {
    return null
  }
}
