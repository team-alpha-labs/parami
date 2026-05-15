import { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import { getPaymentsByUserId } from '@/lib/queries/payments'

// GET /api/payments/me — 본인 결제 내역 전체 조회 (인증 필요)
// 응답: 결제 내역 배열 (최신순). 없으면 빈 배열 []
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증
    const session = requireUser(request)
    if (!session) return err('로그인이 필요합니다.', 401)

    // 토큰의 uid로 본인 결제 내역 조회
    const payments = await getPaymentsByUserId(session.uid)

    return ok(payments)
  } catch (error) {
    // 서버 로그엔 상세, 클라이언트엔 generic 메시지 (보안)
    console.error('GET /api/payments/me error:', error)
    return err('결제 내역 조회 실패.', 500)
  }
}
