import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { listAllTriggers } from '@/lib/queries/admin'

// GET /api/admin/triggers — 트리거 발동 내역 (관리자 전용)
// 응답: 최신순. 발동 근거(weather_logs.rain_mm/temp_c/wind_ms/pm25) JOIN 포함
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request)
    if (!session) return err('관리자 권한이 필요합니다.', 403)

    const triggers = await listAllTriggers()
    return ok(triggers)
  } catch (error) {
    console.error('GET /api/admin/triggers error:', error)
    return err('트리거 내역 조회 실패', 500)
  }
}
