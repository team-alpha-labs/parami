import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getPaymentsByUserId } from '@/lib/payments'

// GET /api/payments/me — 본인 결제 내역 전체 조회 (인증 필요)
// 응답: 결제 내역 배열 (최신순). 없으면 빈 배열 []
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증
    const session = getSession(request)
    if (!session) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 토큰의 userId로 본인 결제 내역 조회
    const payments = await getPaymentsByUserId(session.userId as number)

    return NextResponse.json({
      success: true,
      data: payments,
    })
  } catch (error) {
    // 서버 로그엔 상세, 클라이언트엔 generic 메시지 (보안)
    console.error('GET /api/payments/me error:', error)
    return NextResponse.json(
      { success: false, error: '결제 내역 조회 실패' },
      { status: 500 }
    )
  }
}
