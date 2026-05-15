import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listAllRewards } from '@/lib/queries/admin'

// GET /api/admin/rewards — 보상 지급 내역 (관리자 전용)
// 응답: 최신순. 유저(email/name) + 트리거(type) JOIN 포함 — 한 화면에서 누가/언제/왜 받았는지 파악
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request)
    if (!session) return err('관리자 권한이 필요합니다.', 403)

    const rewards = await listAllRewards()
    return ok(rewards)
  } catch (error) {
    console.error('GET /api/admin/rewards error:', error)
    return err('보상 내역 조회 실패', 500)
  }
}
