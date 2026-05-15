import { NextRequest } from 'next/server'
import { requireUser } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import { getRewardSummaryByUserId } from '@/lib/queries/rewards'

// GET /api/rewards/summary — 본인 보상 누적 요약 (총 횟수/금액 + 이번 달 횟수, 인증 필요)
// 응답: { totalCount, totalAmount, thisMonthCount } 객체. 보상 없어도 0 보장 (null 아님)
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 토큰 추출 + 검증
    const session = requireUser(request)
    if (!session) return err('로그인이 필요합니다.', 401)

    // 토큰의 uid로 누적 통계 조회 (KST 기준 이번 달 포함)
    const summary = await getRewardSummaryByUserId(session.uid)

    return ok(summary)
  } catch (error) {
    // 서버 로그엔 상세, 클라이언트엔 generic 메시지 (보안)
    console.error('GET /api/rewards/summary error:', error)
    return err('보상 요약 조회 실패.', 500)
  }
}
