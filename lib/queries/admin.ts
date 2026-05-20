// 관리자 조회 전용 쿼리 모음
// 모든 함수는 관리자 권한 검증(requireAdmin) 후에만 호출되어야 함

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export type AdminUserRow = {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  balance: number
  created_at: Date
  // 가장 최근 구독 스냅샷 — 구독 이력이 없는 유저는 셋 다 NULL
  tier: 'basic' | 'standard' | 'premium' | null
  status: 'active' | 'cancelled' | 'expired' | null
  cancelled_at: Date | null
}

// 한 유저가 cancelled 후 재가입한 경우를 위해 가장 최근 구독을 LEFT JOIN으로 붙임
// (1인 1 active 보장이지만 cancelled/expired 이력은 여러 개 가능)
// correlated subquery는 admin 트래픽 규모에선 충분 — 별도 인덱스 추가 불필요
export async function listAllUsers(): Promise<AdminUserRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.email, u.name, u.role, u.balance, u.created_at,
            s.tier, s.status, s.cancelled_at
     FROM users u
     LEFT JOIN subscriptions s ON s.id = (
       SELECT id FROM subscriptions
       WHERE user_id = u.id
       ORDER BY started_at DESC, id DESC
       LIMIT 1
     )
     ORDER BY u.created_at DESC, u.id DESC`,
  )
  return rows as AdminUserRow[]
}

export type AdminSubscriptionRow = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  tier: 'basic' | 'standard' | 'premium'
  status: 'active' | 'cancelled'
  next_billing_at: Date | null
  started_at: Date
  cancelled_at: Date | null
}

export async function listAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.user_id, u.email AS user_email, u.name AS user_name,
            s.tier, s.status, s.next_billing_at, s.started_at, s.cancelled_at
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.started_at DESC, s.id DESC`,
  )
  return rows as AdminSubscriptionRow[]
}

export type AdminPaymentRow = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  subscription_id: number
  amount: number
  method: string
  status: 'success' | 'fail' | 'cancelled'
  toss_order_id: string
  billing_year: number | null
  billing_month: number | null
  paid_at: Date
}

// toss_payment_key는 결제 취소/환불 권한키라 관리자 응답에서도 제외
export async function listAllPayments(): Promise<AdminPaymentRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.user_id, u.email AS user_email, u.name AS user_name,
            p.subscription_id, p.amount, p.method, p.status,
            p.toss_order_id, p.billing_year, p.billing_month, p.paid_at
     FROM payments p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.paid_at DESC, p.id DESC`,
  )
  return rows as AdminPaymentRow[]
}

export type AdminTriggerRow = {
  id: number
  weather_log_id: number
  trigger_type: 'rain' | 'heat' | 'cold' | 'snow' | 'dust' | 'good_weather'
  triggered_at: Date
  triggered_date: string
  // 발동 근거가 된 날씨 측정값 — 운영자가 한 화면에서 "왜 이 트리거가 떴는지" 파악
  rain_mm: number | null
  temp_c: number | null
  wind_ms: number | null
  pm25: number | null
  // rain 트리거 한정 — 발동 시점까지의 일 누적 강수량 (실제 판정 시 본 값)
  // measured_at <= triggered_at으로 컷오프 — 발동 후 추가로 온 비는 제외
  // (오전 발동 후 오후 추가 강수가 합산되면 "왜 이 값으로 발동?" 오해 발생)
  // dedupe 위해 (measured_at, MAX) GROUP BY 후 SUM
  daily_rain_total: number | null
  // 이 트리거로 보상 받은 유저 수 / 총 지급액 — reward_logs 집계
  // (trigger_logs UNIQUE(trigger_type, triggered_date) 보장이라 한 trigger_log_id당 N건의 reward_logs)
  affected_users: number
  total_reward_amount: number
}

// 트리거 발동 내역 — 최신순, 발동 근거(날씨 스냅샷) + 보상 집계 JOIN
// reward_logs는 LEFT JOIN(서브쿼리) — 트리거는 떴지만 아직 보상 지급 전이거나
// 아무도 active 구독 아닌 케이스에서 0건이 자연스럽게 나옴
// daily_rain_total: rain 트리거 한정 — 발동 시점까지의 누적 강수량.
//   measured_at <= triggered_at 컷오프로 "발동 당시 본 값"을 정확히 재현
//   (발동 후 추가로 온 비는 제외 — 그래야 운영자가 "왜 이 값으로 발동?" 추적 가능).
//   다른 트리거 행에는 NULL (해당 없음).
export async function listAllTriggers(): Promise<AdminTriggerRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.weather_log_id, t.trigger_type, t.triggered_at, t.triggered_date,
            w.rain_mm, w.temp_c, w.wind_ms, w.pm25,
            CASE WHEN t.trigger_type = 'rain' THEN (
              SELECT COALESCE(SUM(rain_mm), 0) FROM (
                SELECT measured_at, MAX(rain_mm) AS rain_mm
                FROM weather_logs
                WHERE DATE(CONVERT_TZ(measured_at, '+00:00', '+09:00')) = t.triggered_date
                  AND measured_at <= t.triggered_at
                GROUP BY measured_at
              ) d
            ) ELSE NULL END AS daily_rain_total,
            COALESCE(r.affected_users, 0) AS affected_users,
            COALESCE(r.total_reward_amount, 0) AS total_reward_amount
     FROM trigger_logs t
     JOIN weather_logs w ON w.id = t.weather_log_id
     LEFT JOIN (
       SELECT trigger_log_id,
              COUNT(DISTINCT user_id) AS affected_users,
              SUM(amount) AS total_reward_amount
       FROM reward_logs
       GROUP BY trigger_log_id
     ) r ON r.trigger_log_id = t.id
     ORDER BY t.triggered_at DESC, t.id DESC`,
  )
  return rows.map((r) => ({
    ...r,
    daily_rain_total: r.daily_rain_total != null ? Number(r.daily_rain_total) : null,
    affected_users: Number(r.affected_users),
    total_reward_amount: Number(r.total_reward_amount),
  })) as AdminTriggerRow[]
}

export type AdminRewardRow = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  trigger_log_id: number
  trigger_type: 'rain' | 'heat' | 'cold' | 'snow' | 'dust' | 'good_weather'
  amount: number
  tier_at_reward: 'basic' | 'standard' | 'premium'
  reward_year: number
  reward_month: number
  rewarded_at: Date
}

// 보상 지급 내역 — 최신순, 유저/트리거 컨텍스트 함께 JOIN
export async function listAllRewards(): Promise<AdminRewardRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT r.id, r.user_id, u.email AS user_email, u.name AS user_name,
            r.trigger_log_id, t.trigger_type,
            r.amount, r.tier_at_reward, r.reward_year, r.reward_month, r.rewarded_at
     FROM reward_logs r
     JOIN users u ON u.id = r.user_id
     JOIN trigger_logs t ON t.id = r.trigger_log_id
     ORDER BY r.rewarded_at DESC, r.id DESC`,
  )
  return rows as AdminRewardRow[]
}

// ─────────────────────────────────────────────────────────────
// /admin/dashboard 통계 — 누적 수치 + 전월 대비 변화율
// ─────────────────────────────────────────────────────────────

export type DashboardStats = {
  totals: {
    users: number              // 전체 누적 회원수
    activeSubscriptions: number // 현재 active 구독 수
    rewardAmount: number       // 전체 누적 보상 지급액
    thisMonthRevenue: number   // 이번 달 결제 합계 (KST, billing_year/month 기준)
  }
  // 전월 동기 대비 % 변화율. 전월 값이 0이면 null (분모 0 회피)
  changes: {
    users: number | null
    activeSubscriptions: number | null
    rewardAmount: number | null
    revenue: number | null
  }
}

// MySQL 서버가 UTC라고 가정. KST 기준 월 시작/끝을 UTC datetime string으로 변환.
// users.created_at, subscriptions.started_at 같은 DATETIME 컬럼 비교용.
function kstMonthRangeAsUtcString(year: number, month: number) {
  const startMs = Date.UTC(year, month - 1, 1) - 9 * 60 * 60 * 1000
  const endMs = Date.UTC(year, month, 1) - 9 * 60 * 60 * 1000
  const fmt = (ms: number) =>
    new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
  return { start: fmt(startMs), end: fmt(endMs) }
}

function previousMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

// 전월 대비 % (소수점 1자리). 전월 0이면 null
function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((now - prev) / prev) * 1000) / 10
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // KST 기준 현재 연/월
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const thisYear = kstNow.getUTCFullYear()
  const thisMonth = kstNow.getUTCMonth() + 1
  const prev = previousMonth(thisYear, thisMonth)

  const thisRange = kstMonthRangeAsUtcString(thisYear, thisMonth)
  const prevRange = kstMonthRangeAsUtcString(prev.year, prev.month)

  // 누적/현재 4종 + 변화 측정용 8종 = 총 12 쿼리. Promise.all로 병렬 처리
  const [
    usersTotal,
    activeSubsTotal,
    rewardTotal,
    thisRevenue,
    prevRevenue,
    thisUsers,
    prevUsers,
    thisSubs,
    prevSubs,
    thisReward,
    prevReward,
  ] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT COUNT(*) AS c FROM users'),
    pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM subscriptions WHERE status='active'",
    ),
    pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) AS c FROM reward_logs',
    ),
    pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(amount), 0) AS c FROM payments WHERE status='success' AND billing_year=? AND billing_month=?",
      [thisYear, thisMonth],
    ),
    pool.query<RowDataPacket[]>(
      "SELECT COALESCE(SUM(amount), 0) AS c FROM payments WHERE status='success' AND billing_year=? AND billing_month=?",
      [prev.year, prev.month],
    ),
    // 신규 가입 (이번 달 vs 전월)
    pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at < ?',
      [thisRange.start, thisRange.end],
    ),
    pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at < ?',
      [prevRange.start, prevRange.end],
    ),
    // 신규 active 구독 (이번 달 vs 전월)
    pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM subscriptions WHERE status='active' AND started_at >= ? AND started_at < ?",
      [thisRange.start, thisRange.end],
    ),
    pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM subscriptions WHERE status='active' AND started_at >= ? AND started_at < ?",
      [prevRange.start, prevRange.end],
    ),
    // 보상 지급 (이번 달 vs 전월)
    pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) AS c FROM reward_logs WHERE reward_year=? AND reward_month=?',
      [thisYear, thisMonth],
    ),
    pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) AS c FROM reward_logs WHERE reward_year=? AND reward_month=?',
      [prev.year, prev.month],
    ),
  ])

  // pool.query 반환은 [rows, fields] 튜플 — rows[0]가 첫 행
  const n = (r: [RowDataPacket[], unknown]) => Number(r[0][0].c)

  return {
    totals: {
      users: n(usersTotal),
      activeSubscriptions: n(activeSubsTotal),
      rewardAmount: n(rewardTotal),
      thisMonthRevenue: n(thisRevenue),
    },
    changes: {
      users: pctChange(n(thisUsers), n(prevUsers)),
      activeSubscriptions: pctChange(n(thisSubs), n(prevSubs)),
      rewardAmount: pctChange(n(thisReward), n(prevReward)),
      revenue: pctChange(n(thisRevenue), n(prevRevenue)),
    },
  }
}

// ─────────────────────────────────────────────────────────────
// 최근 활동 — 5개 이벤트 소스 UNION ALL로 시간순
// ─────────────────────────────────────────────────────────────

export type RecentActivity = {
  type: 'signup' | 'payment' | 'reward' | 'trigger' | 'cancel'
  email: string | null
  name: string | null
  amount: number | null
  trigger_type: string | null
  at: Date
}

export async function getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
  // 5개 이벤트 소스를 UNION ALL로 합쳐 시간순 정렬 후 LIMIT
  // 컬럼 수/타입이 맞아야 union 가능 → 빈 컬럼은 NULL로 채움
  const [rows] = await pool.query<RowDataPacket[]>(
    `(
       SELECT 'signup' AS type, u.email, u.name,
              NULL AS amount, NULL AS trigger_type, u.created_at AS at
       FROM users u
     )
     UNION ALL
     (
       SELECT 'payment' AS type, u.email, u.name,
              p.amount, NULL AS trigger_type, p.paid_at AS at
       FROM payments p JOIN users u ON u.id = p.user_id
       WHERE p.status = 'success'
     )
     UNION ALL
     (
       SELECT 'reward' AS type, u.email, u.name,
              r.amount, NULL AS trigger_type, r.rewarded_at AS at
       FROM reward_logs r JOIN users u ON u.id = r.user_id
     )
     UNION ALL
     (
       SELECT 'trigger' AS type, NULL AS email, NULL AS name,
              NULL AS amount, t.trigger_type, t.triggered_at AS at
       FROM trigger_logs t
     )
     UNION ALL
     (
       SELECT 'cancel' AS type, u.email, u.name,
              NULL AS amount, NULL AS trigger_type, s.cancelled_at AS at
       FROM subscriptions s JOIN users u ON u.id = s.user_id
       WHERE s.cancelled_at IS NOT NULL
     )
     ORDER BY at DESC
     LIMIT ?`,
    [limit],
  )
  return rows as RecentActivity[]
}

// ─────────────────────────────────────────────────────────────
// 구독 분포 — active 구독 기준 티어별 카운트
// ─────────────────────────────────────────────────────────────

export type SubscriptionDistribution = {
  tier: 'basic' | 'standard' | 'premium'
  count: number
}

export async function getSubscriptionDistribution(): Promise<SubscriptionDistribution[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tier, COUNT(*) AS count
     FROM subscriptions
     WHERE status='active'
     GROUP BY tier`,
  )
  return rows.map((r) => ({ tier: r.tier, count: Number(r.count) }))
}

export type AdminWithdrawalRow = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  amount: number
  withdrawn_at: Date
}

// 출금 내역 — 최신순, 유저 컨텍스트(이메일/이름) JOIN
export async function listAllWithdrawals(): Promise<AdminWithdrawalRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT w.id, w.user_id, u.email AS user_email, u.name AS user_name,
            w.amount, w.withdrawn_at
     FROM withdrawal_logs w
     JOIN users u ON u.id = w.user_id
     ORDER BY w.withdrawn_at DESC, w.id DESC`,
  )
  return rows as AdminWithdrawalRow[]
}
