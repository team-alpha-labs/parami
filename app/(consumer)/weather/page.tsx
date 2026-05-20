'use client'

// /weather — 서울 현재 날씨 + 트리거 조건 대비 + 주간 예보(시안용 더미)
// TODO: 주간 예보 데이터는 후속 PR에서 KMA 단기예보 API 연동 예정.
//       현재는 시각 시안 매칭용 더미 데이터 (백엔드 API 미구현).

import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CloudRain,
  CloudSnow,
  Snowflake,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'
import { api } from '@/lib/client'
import { TRIGGER_CONDITIONS } from '@/lib/conditions'
import { cn } from '@/lib/utils'

type WeatherSnapshot = {
  measured_at: string
  location: string
  rain_mm: number | null
  // KST 자정~현재까지 weather_logs.rain_mm SUM. rain 트리거 판정 기준 (백엔드와 동일).
  today_rain_total: number
  temp_c: number | null
  wind_ms: number | null
  pty: number | null
  snow: boolean
  pm25: number | null
  pm10: number | null
}

// "2026년 5월 18일 월요일" + "오후 2:00" — KST 고정
function formatDateLong(s: string | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}
function formatTimeKST(s: string | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// 주간 예보 더미 (시안 매칭용 — 후속 PR에서 KMA 단기예보 API로 교체)
// 오늘 기준 7일치. 요일은 렌더 시점 동적 생성 (오늘/월/화/...), 날씨는 정적 매핑.
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

function getNextDays(count: number) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const label = i === 0 ? '오늘' : WEEKDAYS_KO[d.getDay()]
    return { key: d.toISOString().split('T')[0], label }
  })
}

// 정적 날씨 더미 (여름 톤) — 7일치 인덱스 매핑
const FORECAST_DATA = [
  { icon: Sun, iconColor: 'text-trigger-heat',
    weather: '폭염', pm25: 32, pmLabel: '보통', rain: 0, tempMin: 21, tempMax: 34 },
  { icon: CloudRain, iconColor: 'text-trigger-rain',
    weather: '비', pm25: 18, pmLabel: '좋음', rain: 8, tempMin: 22, tempMax: 28 },
  { icon: Sun, iconColor: 'text-trigger-heat',
    weather: '맑음', pm25: 25, pmLabel: '보통', rain: 0, tempMin: 23, tempMax: 31 },
  { icon: Sun, iconColor: 'text-trigger-heat',
    weather: '폭염', pm25: 35, pmLabel: '보통', rain: 0, tempMin: 24, tempMax: 34 },
  { icon: CloudRain, iconColor: 'text-trigger-rain',
    weather: '소나기', pm25: 15, pmLabel: '좋음', rain: 5, tempMin: 22, tempMax: 27 },
  { icon: Sun, iconColor: 'text-trigger-heat',
    weather: '맑음', pm25: 22, pmLabel: '좋음', rain: 0, tempMin: 21, tempMax: 29 },
  { icon: Wind, iconColor: 'text-trigger-dust',
    weather: '미세먼지', pm25: 65, pmLabel: '나쁨', rain: 0, tempMin: 20, tempMax: 28 },
]

export default function WeatherPage() {
  const { data, isLoading, error } = useQuery<WeatherSnapshot>({
    queryKey: ['weather', 'current'],
    queryFn: () => api.get<WeatherSnapshot>('/api/weather/current'),
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-muted-foreground">
        날씨 정보를 불러오는 중...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-destructive">
        날씨 정보를 불러오지 못했어요.
      </div>
    )
  }

  // 트리거 임계값 대비
  // rain은 일 누적 기준 (백엔드 lib/triggers.ts와 동일) — 종일 보슬비도 누적 3mm 넘으면 충족
  const rainTriggered = data.today_rain_total >= TRIGGER_CONDITIONS.rain
  const heatTriggered = (data.temp_c ?? -999) >= TRIGGER_CONDITIONS.heat
  const coldTriggered = (data.temp_c ?? 999) <= TRIGGER_CONDITIONS.cold
  const tempTriggered = heatTriggered || coldTriggered
  const dustTriggered = (data.pm25 ?? 0) >= TRIGGER_CONDITIONS.dust

  // 큰 카드 우측 큰 아이콘 — snow > rain > 그 외 맑음
  // 조건부로 직접 렌더 (변수에 컴포넌트 담아 <BigIcon/>로 쓰면
  // react-hooks/static-components 룰에 걸림 — 렌더 중 컴포넌트 생성으로 분류)
  const bigIconClass =
    'absolute right-6 top-6 h-12 w-12 opacity-90 md:right-8 md:top-8 md:h-16 md:w-16'

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">날씨 현황</h1>

      {/* 현재 위치 카드 — 사선 그라데이션 + 우측 큰 아이콘 + 그림자 */}
      <div className="relative mt-6 overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-md md:p-8">
        <div className="pr-20 md:pr-24">
          <p className="text-sm opacity-90">현재 위치</p>
          <p className="mt-1 text-3xl font-bold">
            {data.location === 'seoul' ? '서울' : data.location}
          </p>
          <p className="mt-2 text-sm opacity-90">
            {formatDateLong(data.measured_at)} · {formatTimeKST(data.measured_at)}
          </p>
        </div>

        {/* 우측 큰 아이콘 — 현재 날씨 조건 따라 동적 */}
        {data.snow ? (
          <CloudSnow className={bigIconClass} aria-hidden />
        ) : (data.rain_mm ?? 0) > 0 ? (
          <CloudRain className={bigIconClass} aria-hidden />
        ) : (
          <Sun className={bigIconClass} aria-hidden />
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="기온" value={fmt(data.temp_c, '°C')} />
          <Stat label="강수량" value={fmt(data.rain_mm, 'mm')} />
          <Stat label="적설" value={data.snow ? '내림' : '없음'} />
          <Stat label="미세먼지 (PM2.5)" value={fmt(data.pm25, '')} />
        </div>
      </div>

      {/* 오늘의 날씨 + 트리거 대비 */}
      <h2 className="mt-10 text-lg font-semibold text-foreground">오늘의 날씨</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <WeatherTile
          icon={CloudRain}
          label="오늘 누적 강수"
          value={fmt(data.today_rain_total, 'mm')}
          sub={`트리거 일 누적 ${TRIGGER_CONDITIONS.rain}mm`}
          triggered={rainTriggered}
        />
        <WeatherTile
          icon={Thermometer}
          label="기온"
          value={fmt(data.temp_c, '°C')}
          sub={`폭염 ${TRIGGER_CONDITIONS.heat}° / 한파 ${TRIGGER_CONDITIONS.cold}°`}
          triggered={tempTriggered}
        />
        <WeatherTile
          icon={Snowflake}
          label="눈"
          value={data.snow ? '내림' : '없음'}
          sub="초단기실황 PTY"
          triggered={data.snow}
        />
        <WeatherTile
          icon={Wind}
          label="미세먼지 (PM2.5)"
          value={fmt(data.pm25, '')}
          sub={`트리거 ${TRIGGER_CONDITIONS.dust}`}
          triggered={dustTriggered}
        />
      </div>

      {/* 주간 예보 — 시안 매칭용 더미. 후속 PR에서 KMA 단기예보 API 연동 예정 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-6 w-1 rounded bg-primary" aria-hidden />
          <h2 className="text-lg font-bold text-foreground md:text-xl">주간 예보</h2>
        </div>
        <div className="rounded-lg border border-border/50 bg-background p-4 shadow-sm">
          {getNextDays(7).map((day, i) => {
            const f = FORECAST_DATA[i]
            const DayIcon = f.icon
            return (
              <div
                key={day.key}
                className="flex items-center gap-3 py-2 text-sm md:gap-4"
              >
                <span className="w-12 shrink-0 font-medium text-foreground">
                  {day.label}
                </span>
                <DayIcon className={cn('h-5 w-5 shrink-0', f.iconColor)} aria-hidden />
                <span className="w-16 shrink-0 text-foreground">{f.weather}</span>

                {/* 우측 정보 그룹 — ml-auto로 우측 끝에 밀고, 내부에서 컬럼 정렬 */}
                <div className="ml-auto flex items-center gap-4 text-right md:gap-6">
                  <span className="hidden w-32 text-xs text-muted-foreground md:inline">
                    PM2.5 {f.pm25}μg/m³ {f.pmLabel}
                  </span>
                  <span className="hidden w-20 text-xs text-muted-foreground md:inline">
                    강수 {f.rain}mm
                  </span>
                  <span className="w-20 font-medium text-foreground">
                    {f.tempMin}° / {f.tempMax}°
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 트리거 안내 배너 */}
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
        <span>트리거 조건이 충족되면 보상금이 자동으로 들어와요.</span>
      </div>
    </div>
  )
}

function fmt(n: number | null, unit: string) {
  if (n == null) return '-'
  // 외부 API 평균값이 14.81578... 처럼 길게 오는 경우 → 소수점 1자리로 정리
  const rounded = Math.round(n * 10) / 10
  return `${rounded}${unit}`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

function WeatherTile({
  icon: Icon,
  label,
  value,
  sub,
  triggered,
}: {
  icon: typeof CloudRain
  label: string
  value: string
  sub: string
  triggered: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-background p-4 shadow-sm',
        triggered && 'border-destructive/40 bg-destructive/5',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'h-4 w-4',
            triggered ? 'text-destructive' : 'text-muted-foreground',
          )}
        />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p
        className={cn(
          'mt-1 text-xs',
          triggered ? 'font-medium text-destructive' : 'text-muted-foreground',
        )}
      >
        {triggered ? '트리거 조건 충족' : sub}
      </p>
    </div>
  )
}
