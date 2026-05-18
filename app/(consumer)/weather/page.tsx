'use client'

// /weather — 서울 현재 날씨 + 트리거 조건 대비
// 디자인의 "주간 예보"는 KMA 단기예보(다른 API) 필요 — 후속 PR

import { useQuery } from '@tanstack/react-query'
import {
  CloudRain,
  Thermometer,
  Snowflake,
  Wind,
} from 'lucide-react'
import { api } from '@/lib/client'
import { TRIGGER_CONDITIONS } from '@/lib/conditions'
import { cn } from '@/lib/utils'

type WeatherSnapshot = {
  measured_at: string
  location: string
  rain_mm: number | null
  temp_c: number | null
  wind_ms: number | null
  pty: number | null
  snow: boolean
  pm25: number | null
  pm10: number | null
}

function formatDateTimeKST(s: string | undefined) {
  if (!s) return '-'
  const d = new Date(s)
  // 브라우저/배포 타임존 무관하게 KST로 고정 (프로젝트 전반 컨벤션과 일치)
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
  const rainTriggered = (data.rain_mm ?? 0) >= TRIGGER_CONDITIONS.rain
  const heatTriggered = (data.temp_c ?? -999) >= TRIGGER_CONDITIONS.heat
  const coldTriggered = (data.temp_c ?? 999) <= TRIGGER_CONDITIONS.cold
  const tempTriggered = heatTriggered || coldTriggered
  const dustTriggered = (data.pm25 ?? 0) >= TRIGGER_CONDITIONS.dust

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">날씨 현황</h1>

      {/* 현재 위치 카드 */}
      <div className="mt-6 rounded-lg bg-primary p-6 text-primary-foreground md:p-8">
        <p className="text-xs opacity-80">현재 위치</p>
        <p className="mt-1 text-3xl font-bold">
          {data.location === 'seoul' ? '서울' : data.location}
        </p>
        <p className="mt-1 text-xs opacity-80">{formatDateTimeKST(data.measured_at)} 측정</p>

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
          label="강수"
          value={fmt(data.rain_mm, 'mm')}
          sub={`트리거 ${TRIGGER_CONDITIONS.rain}mm`}
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
        'rounded-lg border bg-background p-4',
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
