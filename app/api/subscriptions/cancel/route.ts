import { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import { cancelSubscriptionByUserId } from '@/lib/queries/subscriptions'

// PATCH /api/subscriptions/cancel — 본인 active 구독 해지 (인증 필요)
// 응답: 해지된 구독 정보 (status='cancelled', cancelled_at=NOW()) 또는 404
export async function PATCH(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증
    const session = requireUser(request)
    if (!session) return err('로그인이 필요합니다.', 401)

    // 본인 active 구독을 cancelled로 UPDATE
    const cancelled = await cancelSubscriptionByUserId(session.uid)

    // null = 해지할 active 구독 없음 (이미 해지했거나 구독 안 한 사람)
    if (!cancelled) return err('해지할 active 구독이 없습니다.', 404)

    return ok(cancelled)
  } catch (error) {
    // 서버 로그엔 상세, 클라이언트엔 generic 메시지 (보안)
    console.error('PATCH /api/subscriptions/cancel error:', error)
    return err('구독 해지 실패.', 500)
  }
}
