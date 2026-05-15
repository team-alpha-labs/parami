import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { fetchWeatherSnapshot } from '@/lib/weather'
import { insertWeatherLog } from '@/lib/queries/weather'

// POST /api/scheduler/weather-check
// 호출 주체: GCP Cloud Scheduler (매 시간 KST)
// 동작 (1단계): 외부 API 호출 → weather_logs INSERT
// 향후 추가 예정: 트리거 판정(2단계) + 보상 지급(3단계)
export async function POST(request: NextRequest) {
  // 1) 인증: SCHEDULER_SECRET 헤더가 일치해야 진행
  // 외부에서 막 호출당하면 API 할당량 소모 + DB 오염 가능 → 시크릿으로 차단
  if (!isAuthorized(request)) {
    return err('스케줄러 인증 실패', 401)
  }

  try {
    // 2) 외부 API 호출 (기상청 초단기실황 + 에어코리아)
    // KST 정시 1시간 이전 기준 (kstPreviousHour) → 데이터 발행 지연 회피
    const snap = await fetchWeatherSnapshot()

    // 3) weather_logs INSERT — raw 응답 포함해 통째로 보존
    const weather_log_id = await insertWeatherLog(snap)

    // 4) 응답: 어떤 행이 들어갔는지 + 핵심 값 요약 (디버깅·모니터링용)
    return ok({
      weather_log_id,
      measured_at: snap.measured_at,
      rain_mm: snap.rain_mm,
      temp_c: snap.temp_c,
      wind_ms: snap.wind_ms,
      pty: snap.pty,
      snow: snap.snow,
      pm25: snap.pm25,
      pm10: snap.pm10,
    })
  } catch (error) {
    // 외부 API 장애·DB 연결 실패 시 5xx 반환
    // Cloud Scheduler는 5xx 받으면 자동 재시도 정책에 따라 재호출 (지수 백오프)
    console.error('POST /api/scheduler/weather-check error:', error)
    return err('스케줄러 실행 실패', 500)
  }
}

// Authorization 헤더 검증
// 형식: "Bearer {SCHEDULER_SECRET}"
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.SCHEDULER_SECRET
  if (!expected) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${expected}`
}
