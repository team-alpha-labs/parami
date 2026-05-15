import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/api'
import { expireOverdueSubscriptions } from '@/lib/queries/subscriptions'

// POST /api/scheduler/expire-subscriptions
// Cloud Scheduler가 매일 호출 — 단건 결제 모델에서 next_billing_at 지나도 결제 안 한
// active 구독을 'expired'로 자동 전환 (좀비 구독 방지 + 보상 정확도 보장)
//
// 인증: SCHEDULER_SECRET 헤더 검증
// Cloud Scheduler 설정 시 HTTP 헤더 'X-Scheduler-Secret'에 .env.local의 SCHEDULER_SECRET 값 주입
export async function POST(request: NextRequest) {
  try {
    // 1) 스케줄러 인증
    // Cloud Scheduler 외에선 호출 불가 — 일반 사용자가 호출하면 active 구독 모두 만료시킬 수 있어서 위험
    const secret = process.env.SCHEDULER_SECRET
    if (!secret) {
      console.error('SCHEDULER_SECRET 환경변수 누락')
      return err('서버 설정 오류', 500)
    }

    const headerSecret = request.headers.get('x-scheduler-secret')
    if (headerSecret !== secret) {
      return err('인증 실패', 401)
    }

    // 2) 만료 처리 일괄 실행
    // 단순 UPDATE 한 번 — 트랜잭션 불필요 (원자성은 단일 쿼리로 보장됨)
    const expiredCount = await expireOverdueSubscriptions()

    // 3) 처리 결과 반환 (운영 모니터링용)
    console.log(`[scheduler] expired ${expiredCount} subscriptions`)
    return ok({ expiredCount })
  } catch (error) {
    console.error('POST /api/scheduler/expire-subscriptions error:', error)
    return err('만료 처리 실패', 500)
  }
}
