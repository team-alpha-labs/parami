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
