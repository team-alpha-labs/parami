'use client'

// 헤더 우측 실시간 날씨 위젯
// - /api/weather/current 호출 (스케줄러가 매 시간 모으는 실측 데이터와 동일 소스)
// - 4종(기온/강수/눈/미세먼지)을 1초 간격으로 페이드 전환
// - 전체 영역이 /weather 페이지로 이동하는 링크
// - 헤더는 모든 페이지에 떠 있어 staleTime을 길게(60s) 둬서 라우팅마다 refetch 안 함

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudRain, Snowflake, Thermometer, Wind } from 'lucide-react'
import { api } from '@/lib/client'

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

// 4개 데이터 전환 주기 — 너무 빠르면 읽기 전에 넘어감, 너무 느리면 정적으로 보임
const ROTATE_INTERVAL_MS = 1000

export function HeaderWeather() {
  const { data } = useQuery<WeatherSnapshot>({
    queryKey: ['weather', 'current'],
    queryFn: () => api.get<WeatherSnapshot>('/api/weather/current'),
    staleTime: 60_000,
  })

  // data가 아직 없을 땐 '-' 표시. 호출 실패 시에도 깨지지 않게 null-safe
  const stats = [
    {
      key: 'temp',
      Icon: Thermometer,
      label: '기온',
      value: data?.temp_c != null ? `${data.temp_c}°C` : '-',
    },
    {
      key: 'rain',
      Icon: CloudRain,
      label: '강수',
      value: data?.rain_mm != null ? `${data.rain_mm}mm` : '-',
    },
    {
      key: 'snow',
      Icon: Snowflake,
      label: '눈',
      value: data?.snow ? '내림' : '없음',
    },
    {
      key: 'pm25',
      Icon: Wind,
      label: 'PM2.5',
      value: data?.pm25 != null ? data.pm25.toFixed(0) : '-',
    },
  ]

  const [index, setIndex] = useState(0)

  // setInterval은 stats 길이에 의존하지 않음 — 4종 고정이라 % stats.length로 wrap
  useEffect(() => {
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % stats.length),
      ROTATE_INTERVAL_MS,
    )
    return () => clearInterval(id)
  }, [stats.length])

  const current = stats[index]
  const Icon = current.Icon

  return (
    <Link
      href="/weather"
      aria-label="날씨 현황 보기"
      className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {/* min-w로 슉슉 전환 시 헤더 폭 점프 방지 (가장 긴 케이스 기준 ≈ 130px) */}
      <AnimatePresence mode="wait">
        <motion.span
          key={current.key}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="flex min-w-[8rem] items-center gap-1"
        >
          <Icon className="h-4 w-4" />
          <span>
            {current.label} {current.value}
          </span>
        </motion.span>
      </AnimatePresence>
    </Link>
  )
}
