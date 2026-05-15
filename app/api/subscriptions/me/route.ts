import { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import { getActiveSubscriptionByUserId } from '@/lib/queries/subscriptions'

// GET /api/subscriptions/me — 본인 현재 구독 상태 조회 (인증 필요)
// 응답: active 구독 있으면 객체, 없으면 data: null (신규 가입자 케이스)
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증 (실패 시 null)
    const session = requireUser(request)
    if (!session) return err('로그인이 필요합니다.', 401)

    // 토큰의 uid로 본인 active 구독 조회
    const subscription = await getActiveSubscriptionByUserId(session.uid)

    return ok(subscription)
  } catch (error) {
    // DB 연결 실패 등 예외: 서버 로그엔 상세, 클라이언트엔 generic (내부 정보 노출 방지)
    console.error('GET /api/subscriptions/me error:', error)
    return err('구독 상태 조회 실패.', 500)
  }
}
