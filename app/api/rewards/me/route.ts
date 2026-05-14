import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import { getRewardsByUserId } from '@/lib/queries/rewards'

// GET /api/rewards/me — 본인 보상 내역 전체 조회 (인증 필요)
// 응답: 보상 내역 배열 (최신순). 없으면 빈 배열 []
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증
    const session = getSession(request)
    if (!session) return err('로그인이 필요합니다', 401)

    // 토큰의 uid로 본인 보상 내역 조회
    const rewards = await getRewardsByUserId(session.uid)

    return ok(rewards)
  } catch (error) {
    // 서버 로그엔 상세, 클라이언트엔 generic 메시지 (보안)
    console.error('GET /api/rewards/me error:', error)
    return err('보상 내역 조회 실패', 500)
  }
}
