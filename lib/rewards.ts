// 보상 지급 공통 헬퍼
// - 티어별 보상 금액 조회
// - KST 기준 연/월 추출 (reward_logs.reward_year/reward_month 컬럼용)

import { REWARD_AMOUNT_PER_TRIGGER_BY_TIER } from '@/lib/conditions'

export type Tier = 'basic' | 'standard' | 'premium'

export function getRewardAmount(tier: Tier): number {
  return REWARD_AMOUNT_PER_TRIGGER_BY_TIER[tier]
}

// trigger 발동 시각의 KST 연/월. 월 캡 카운트와 reward_logs 저장에 동일 기준 사용.
// (한국은 DST 없음 → UTC+9 고정 오프셋)
export function getKstYearMonth(d: Date): { year: number; month: number } {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
  }
}

// KST 기준 YYYY-MM-DD. 일 1회 캡 비교에 사용.
// trigger 발동 시각을 KST로 옮긴 후 날짜만 추출 — UTC 자정 케이스에 영향 없음.
export function getKstDateString(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
