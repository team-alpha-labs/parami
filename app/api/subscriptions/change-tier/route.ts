import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { ok, err } from '@/lib/api'
import {
  getActiveSubscriptionByUserId,
  setPendingTierByUserId,
} from '@/lib/queries/subscriptions'

// 허용되는 티어 값 (DB ENUM과 일치)
const VALID_TIERS = ['basic', 'standard', 'premium'] as const
type Tier = (typeof VALID_TIERS)[number]

// PATCH /api/subscriptions/change-tier — 티어 변경 요청 (인증 필요)
// 즉시 변경 아니고 pending_tier에 예약 → 다음 결제 시 적용
// 요청 body: { newTier: 'basic' | 'standard' | 'premium' }
export async function PATCH(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = getSession(request)
    if (!session) return err('로그인이 필요합니다', 401)

    // 2. body 파싱 (JSON 아니면 catch에서 null)
    const body = (await request.json().catch(() => null)) as { newTier?: string } | null
    if (!body?.newTier) return err('newTier는 필수입니다', 400)

    // 3. newTier 값 유효성 검증 (ENUM 값 중 하나)
    if (!VALID_TIERS.includes(body.newTier as Tier)) {
      return err('newTier는 basic/standard/premium 중 하나여야 합니다', 400)
    }
    const newTier = body.newTier as Tier

    // 4. 현재 active 구독 조회
    const current = await getActiveSubscriptionByUserId(session.uid)
    if (!current) return err('변경할 active 구독이 없습니다', 404)

    // 5. 현재 티어와 같으면 거부 (무의미한 요청)
    if (current.tier === newTier) {
      return err('이미 해당 티어로 구독 중입니다', 400)
    }

    // 6. pending_tier 업데이트 (tier 자체는 안 바꿈 — 다음 결제 때 적용)
    const updated = await setPendingTierByUserId(session.uid, newTier)
    if (!updated) return err('변경할 active 구독이 없습니다', 404)

    return ok(updated)
  } catch (error) {
    console.error('PATCH /api/subscriptions/change-tier error:', error)
    return err('티어 변경 실패', 500)
  }
}
