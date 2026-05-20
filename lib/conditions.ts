export const TRIGGER_CONDITIONS = {
  // rain: KST 일 누적 mm (weather_logs.rain_mm 자정~현재 SUM)
  //   시간당 RN1 단독 비교는 "종일 보슬비 미발동" 한계가 있어 일 누적으로 전환.
  //   임계값 3mm는 기상청 평년 통계(서울 일 강수 3mm↑ 월 4회)와 일치.
  rain: 3,
  heat: 33,
  cold: -12,
  dust: 50,
  // snow: 초단기실황(getUltraSrtNcst) PTY 코드 기준
  //   0:없음 / 1:비 / 2:비눈 / 3:눈 / 5:빗방울 / 6:빗방울눈날림 / 7:눈날림
  //   → 눈 트리거는 PTY ∈ {2, 3, 6, 7} 로 판정 (PTY=4는 초단기예보에서만 사용, 실황에는 없음)
}

export const GOOD_WEATHER_CONDITIONS = {
  rain_max: 1,
  dust_max: 30,
  wind_max: 5,
  months: [4, 5, 6, 9, 10, 11],
}

export const MAX_REWARD_PER_MONTH = 10

// 초단기실황 PTY 코드 중 눈으로 간주하는 값들
// readonly number[]로 두면 Array.includes() 호출 시 타입이 편함
export const SNOW_PTY_CODES: readonly number[] = [2, 3, 6, 7]

// 트리거 1회당 지급 보상금 (단위: 원)
// plans.description의 월 보상금(9,000/16,000/26,000) / MAX_REWARD_PER_MONTH(10)
// = 900 / 1,600 / 2,600. 월 10회 캡까지 모두 채우면 명세 월 보상금과 일치.
// (이전 800/1,400/2,300에서 인상 — 2026.05.19, mig 005로 과거 reward_logs 소급 적용)
export const REWARD_AMOUNT_PER_TRIGGER_BY_TIER = {
  basic: 900,
  standard: 1600,
  premium: 2600,
} as const
