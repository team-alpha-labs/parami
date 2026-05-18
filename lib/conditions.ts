export const TRIGGER_CONDITIONS = {
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
// plans.description의 월 보상금(8,000/14,000/23,000) / MAX_REWARD_PER_MONTH(10)
// = 800 / 1,400 / 2,300. 월 10회 캡까지 모두 채우면 명세 월 보상금과 일치.
// 랜딩 Intro의 연간 기대액(basic 90,700 / standard 158,600 / premium 260,600)과
// 평균 9.5회/월 × 12개월 기준으로 정합.
export const REWARD_AMOUNT_PER_TRIGGER_BY_TIER = {
  basic: 800,
  standard: 1400,
  premium: 2300,
} as const
