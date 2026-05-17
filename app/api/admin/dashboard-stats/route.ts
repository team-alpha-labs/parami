import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import {
  getDashboardStats,
  getRecentActivity,
  getSubscriptionDistribution,
} from '@/lib/queries/admin'

// GET /api/admin/dashboard-stats
// 관리자 대시보드 한 화면에 필요한 모든 집계를 한 번에 반환
// 응답: { totals, changes, recent, distribution }
//   - totals/changes: 통계 카드 4개 (누적 + 전월 대비 %)
//   - recent: 최근 활동 5건 (4개 테이블 UNION)
//   - distribution: active 구독 티어별 카운트
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request)
    if (!session) return err('관리자 권한이 필요합니다.', 403)

    // 세 함수 병렬 호출 — 서로 독립이라 latency 절감
    const [stats, recent, distribution] = await Promise.all([
      getDashboardStats(),
      getRecentActivity(5),
      getSubscriptionDistribution(),
    ])

    return ok({ ...stats, recent, distribution })
  } catch (error) {
    console.error('GET /api/admin/dashboard-stats error:', error)
    return err('대시보드 통계 조회 실패', 500)
  }
}
