import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { expireOverdueSubscriptions } from '@/lib/queries/subscriptions'

// POST /api/scheduler/expire-subscriptions
// 호출 주체: GCP Cloud Scheduler (매일 KST 03:00 권장)
// 동작: next_billing_at 지난 active 구독을 'expired'로 자동 전환
// 단건 결제 모델에서 좀비 active 방지 + 보상 지급 정확도 보장
export async function POST(request: NextRequest) {
  // 1) 인증: SCHEDULER_SECRET 헤더 검증 (weather-check와 동일 패턴)
  // 일반 사용자 호출 시 본인 외 active 모두 만료시킬 수 있어 보안 중요
  if (!isAuthorized(request)) {
    return err('스케줄러 인증 실패', 401)
  }

  try {
    // 2) 만료 처리 일괄 실행 (단일 UPDATE — 트랜잭션 불필요)
    const expiredCount = await expireOverdueSubscriptions()

    // 3) 처리 결과 반환 (운영 모니터링용 — Cloud Scheduler 로그에서 추적)
    console.log(`[scheduler] expired ${expiredCount} subscriptions`)
    return ok({ expiredCount })
  } catch (error) {
    // 5xx 반환 시 Cloud Scheduler가 지수 백오프로 자동 재시도
    console.error('POST /api/scheduler/expire-subscriptions error:', error)
    return err('만료 처리 실패', 500)
  }
}

// Authorization 헤더 검증
// 형식: "Bearer {SCHEDULER_SECRET}" (weather-check route와 통일)
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.SCHEDULER_SECRET
  if (!expected) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${expected}`
}
