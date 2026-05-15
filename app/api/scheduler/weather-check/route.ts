import { NextRequest } from 'next/server'
import { err, ok } from '@/lib/api'
import { fetchWeatherSnapshot } from '@/lib/weather'
import { insertWeatherLog } from '@/lib/queries/weather'
import { evaluateTriggers, toKstDateString } from '@/lib/triggers'
import { insertTriggerLog } from '@/lib/queries/triggers'
import { getRewardAmount, getKstYearMonth } from '@/lib/rewards'
import { MAX_REWARD_PER_MONTH } from '@/lib/conditions'
import {
  getEligibleUsersForReward,
  getMonthlyRewardCount,
  payoutReward,
} from '@/lib/queries/rewards'

// POST /api/scheduler/weather-check
// 호출 주체: GCP Cloud Scheduler (매 시간 KST)
// 동작 (1~4단계):
//   외부 API → weather_logs INSERT
//   → 트리거 판정 → trigger_logs INSERT
//   → 신규 트리거별 자격 유저에게 reward_logs INSERT + users.balance 증가 (트랜잭션)
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

    // 4) 트리거 판정 + trigger_logs INSERT
    // 같은 시점에 여러 트리거가 동시 발동 가능 (예: 비+미세먼지)
    // UNIQUE(trigger_type, triggered_date)로 하루 1회만 신규 INSERT
    const firedTypes = evaluateTriggers(snap)
    const triggered_date = toKstDateString(snap.measured_at)
    const triggers = await Promise.all(
      firedTypes.map(async (trigger_type) => {
        const r = await insertTriggerLog({
          weather_log_id,
          trigger_type,
          triggered_at: snap.measured_at,
          triggered_date,
        })
        return { trigger_type, inserted: r.inserted, trigger_log_id: r.id }
      }),
    )

    // 5) 보상 지급: 신규 INSERT된 트리거만 처리 (중복 트리거는 이전 회차에서 이미 처리됨)
    // 자격 = active 구독 + 최근 결제 success / 월 10회 캡 / UNIQUE(user_id, trigger_log_id)
    // 처리는 순차로 — 같은 유저에게 시간 내 여러 트리거가 발동될 때 캡 카운트 race 회피
    const rewards = []
    for (const t of triggers) {
      if (!t.inserted || t.trigger_log_id === null) continue
      const summary = await payoutForTrigger(
        t.trigger_log_id,
        snap.measured_at,
      )
      rewards.push({ trigger_log_id: t.trigger_log_id, ...summary })
    }

    // 6) 응답: 어떤 행이 들어갔는지 + 핵심 값 요약 (디버깅·모니터링용)
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
      triggers,
      rewards,
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

// 한 트리거에 대해 자격 있는 유저들에게 순차로 보상 지급
// - 한 유저의 트랜잭션 실패가 다른 유저 지급을 막지 않도록 try/catch로 격리
// - 단일 스케줄러 실행 내 순차 처리는 안전.
// - 잔여 리스크: 캡 체크(getMonthlyRewardCount)가 트랜잭션 밖이라
//   동시 호출(Cloud Scheduler at-least-once 재시도, 수동 호출 등)이
//   서로 다른 trigger_log_id로 진입하면 월 캡 초과 가능. 보강 예정:
//   트랜잭션 안에서 SELECT users.id FOR UPDATE로 유저 단위 락.
//   SCHEDULER_SECRET은 미인가 호출만 차단할 뿐 동시성 제어가 아님.
async function payoutForTrigger(
  trigger_log_id: number,
  measured_at: Date,
): Promise<{
  paid: number
  capped: number
  already_paid: number
  failed: number
}> {
  const { year, month } = getKstYearMonth(measured_at)
  const eligible = await getEligibleUsersForReward()

  let paid = 0
  let capped = 0
  let already_paid = 0
  let failed = 0

  for (const u of eligible) {
    try {
      const monthCount = await getMonthlyRewardCount({
        user_id: u.user_id,
        year,
        month,
      })
      if (monthCount >= MAX_REWARD_PER_MONTH) {
        capped++
        continue
      }

      const amount = getRewardAmount(u.tier)
      const r = await payoutReward({
        user_id: u.user_id,
        trigger_log_id,
        amount,
        tier: u.tier,
        year,
        month,
      })
      if (r.inserted) paid++
      else already_paid++
    } catch (e) {
      console.error(
        `payoutForTrigger failed: user=${u.user_id} trigger=${trigger_log_id}`,
        e,
      )
      failed++
    }
  }

  return { paid, capped, already_paid, failed }
}
