// 한 번의 날씨 스냅샷에서 어떤 트리거가 발동되는지 판정
// 사용처: 스케줄러 — 매 시간 weather_logs INSERT 직후 호출

import {
  TRIGGER_CONDITIONS,
  GOOD_WEATHER_CONDITIONS,
} from '@/lib/conditions'
import type { WeatherSnapshot } from '@/lib/weather'

export type TriggerType =
  | 'rain'
  | 'heat'
  | 'cold'
  | 'snow'
  | 'dust'
  | 'good_weather'

// 같은 시점에 여러 트리거가 동시에 발동될 수 있다 (예: 비 + 미세먼지)
// null 값은 미충족으로 본다 — 외부 API에서 값이 안 온 케이스
export function evaluateTriggers(snap: WeatherSnapshot): TriggerType[] {
  const fired: TriggerType[] = []

  if (snap.rain_mm !== null && snap.rain_mm >= TRIGGER_CONDITIONS.rain) {
    fired.push('rain')
  }
  if (snap.temp_c !== null && snap.temp_c >= TRIGGER_CONDITIONS.heat) {
    fired.push('heat')
  }
  if (snap.temp_c !== null && snap.temp_c <= TRIGGER_CONDITIONS.cold) {
    fired.push('cold')
  }
  // snow는 fetchWeatherSnapshot 단계에서 PTY 코드를 이미 boolean으로 변환
  if (snap.snow) {
    fired.push('snow')
  }
  if (snap.pm25 !== null && snap.pm25 >= TRIGGER_CONDITIONS.dust) {
    fired.push('dust')
  }
  if (isGoodWeather(snap)) {
    fired.push('good_weather')
  }

  return fired
}

// good_weather는 봄·가을(4,5,6,9,10,11월)에만 발동 + 4개 조건 동시 충족
function isGoodWeather(snap: WeatherSnapshot): boolean {
  const kstMonth = getKstMonth(snap.measured_at)
  if (!GOOD_WEATHER_CONDITIONS.months.includes(kstMonth)) return false
  if (snap.rain_mm === null || snap.rain_mm > GOOD_WEATHER_CONDITIONS.rain_max) {
    return false
  }
  if (snap.pm25 === null || snap.pm25 > GOOD_WEATHER_CONDITIONS.dust_max) {
    return false
  }
  if (snap.wind_ms === null || snap.wind_ms > GOOD_WEATHER_CONDITIONS.wind_max) {
    return false
  }
  return true
}

// 서버 타임존 무시하고 KST 기준 월/일 추출
// (한국은 DST 없음 → UTC+9 고정 오프셋)
function getKstMonth(d: Date): number {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return kst.getUTCMonth() + 1
}

// trigger_logs.triggered_date(DATE) 컬럼용 YYYY-MM-DD 문자열 (KST 기준)
// 자정 케이스(예: KST 0시)에도 정확히 그 날짜로 떨어져야 캡 계산이 안 어긋남
export function toKstDateString(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
