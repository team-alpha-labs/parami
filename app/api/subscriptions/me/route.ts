import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getActiveSubscriptionByUserId } from '@/lib/subscriptions'

// GET /api/subscriptions/me — 본인 현재 구독 상태 조회 (인증 필요)
// 응답: active 구독 있으면 객체, 없으면 data: null (신규 가입자 케이스)
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증 (실패 시 null)
    const session = getSession(request)
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 토큰의 userId로 본인 active 구독 조회
    const subscription = await getActiveSubscriptionByUserId(session.userId as number)

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    // DB 연결 실패 등 예외: 서버 로그엔 상세, 클라이언트엔 generic (내부 정보 노출 방지)
    console.error('GET /api/subscriptions/me error:', error)
    return NextResponse.json(
      { success: false, error: '구독 상태 조회 실패' },
      { status: 500 }
    )
  }
}
