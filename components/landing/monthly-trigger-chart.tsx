'use client'

// 월별 평균 자동 지급 횟수 area 차트 (랜딩 §4 Intro)
// 서울 2016~2026 기상 데이터 기반 — 6종 트리거 합산
// 월 10회 캡 적용 (서비스 정책: 월 최대 10회 수령)

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// 원시 데이터 — 서울 2016~2026 월별 평균 (6종 합산)
// 10 초과는 캡 적용 (월 10회 수령 한도)
const RAW_DATA = [
  { month: '1월', total: 17.1 },
  { month: '2월', total: 12.2 },
  { month: '3월', total: 10.0 },
  { month: '4월', total: 9.6 },
  { month: '5월', total: 9.3 },
  { month: '6월', total: 8.6 },
  { month: '7월', total: 14.6 },
  { month: '8월', total: 16.3 },
  { month: '9월', total: 8.3 },
  { month: '10월', total: 7.6 },
  { month: '11월', total: 9.9 },
  { month: '12월', total: 15.7 },
] as const

// 캡 적용 (10회 상한)
const DATA = RAW_DATA.map(({ month, total }) => ({
  month,
  count: Math.min(total, 10),
}))

// 디자인 토큰 hex — globals.css의 --color-primary와 동기화
// recharts SVG fill은 CSS var 불안정 → hex 직접 (drift 주의)
const AREA_COLOR = '#3b82f6'

export function MonthlyTriggerChart() {
  return (
    <div className="mt-12">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
            {/* 그라데이션 정의 — 위 진하고 아래 투명 */}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AREA_COLOR} stopOpacity={0.4} />
                <stop offset="100%" stopColor={AREA_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: '회',
                angle: 0,
                position: 'top',
                offset: 12,
                style: { fontSize: 11, fill: 'var(--color-muted-foreground)' },
              }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(1)}회`, '월 평균 보상']}
            />
            {/* 10회 상한 라인 — 캡 시각화 */}
            <ReferenceLine
              y={10}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="3 3"
              opacity={0.4}
              label={{
                value: '월 최대 10회',
                position: 'right',
                style: { fontSize: 10, fill: 'var(--color-muted-foreground)' },
              }}
            />

            {/* Area — 그라데이션 fill + 윗선 강조 + 각 월 dot */}
            <Area
              type="monotone"
              dataKey="count"
              stroke={AREA_COLOR}
              strokeWidth={2.5}
              fill="url(#areaGradient)"
              dot={{ fill: AREA_COLOR, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        서울 2016~2026 기상 데이터 기반 · 월 최대 10회 한도 적용
      </p>
    </div>
  )
}
