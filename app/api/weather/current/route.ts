import { err, ok } from '@/lib/api'
import { fetchWeatherSnapshot } from '@/lib/weather'
import { getTodayRainTotal } from '@/lib/queries/weather'
import { toKstDateString } from '@/lib/triggers'

export async function GET() {
  try {
    const snap = await fetchWeatherSnapshot()
    // today_rain_total: weather_logs에 저장된 누적 강수량 SUM (스케줄러가 매 시간 INSERT)
    // 이 라우트는 DB INSERT를 안 하므로, 방금 fetch한 snap.rain_mm이 이번 정시 회차로
    // 스케줄러에 의해 이미 저장됐으면 포함되고, 아직 저장 전이면 누락됨 (≤1시간치 오차 가능).
    // 보상 판정은 항상 DB 기준이라 정확하고, 본 표시값만 스케줄러 동기 상태에 의존.
    const today_rain_total = await getTodayRainTotal(toKstDateString(snap.measured_at))
    return ok({
      measured_at: snap.measured_at,
      location: snap.location,
      rain_mm: snap.rain_mm,
      today_rain_total,
      temp_c: snap.temp_c,
      wind_ms: snap.wind_ms,
      pty: snap.pty,
      snow: snap.snow,
      pm25: snap.pm25,
      pm10: snap.pm10,
    })
  } catch (error) {
    console.error('GET /api/weather/current error:', error)
    return err('날씨 정보를 가져올 수 없습니다.', 500)
  }
}
