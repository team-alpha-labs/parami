'use client'

// 헤더 우측 실시간 날씨 위젯
// - /api/weather/current 호출 (스케줄러가 매 시간 모으는 실측 데이터와 동일 소스)
// - 4종(기온/강수/눈/미세먼지)을 2.5초 간격으로 페이드 슬라이드 전환
// - 항목별 디자인 토큰 색상 (§6 TriggerCards COLOR_MAP 패턴과 일관)
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
const ROTATE_INTERVAL_MS = 2500

export function HeaderWeather() {
  const { data } = useQuery<WeatherSnapshot>({
    queryKey: ['weather', 'current'],
    queryFn: () => api.get<WeatherSnapshot>('/api/weather/current'),
    staleTime: 60_000,
  })

  // 색상은 §6 TriggerCards COLOR_MAP과 동일한 디자인 토큰 (text-trigger-*)
  const stats = [
    {
      key: 'temp',
      Icon: Thermometer,
      label: '기온',
      value: data?.temp_c != null ? `${data.temp_c}°C` : '-',
      color: 'text-trigger-heat',
    },
    {
      key: 'rain',
      Icon: CloudRain,
      label: '강수',
      value: data?.rain_mm != null ? `${data.rain_mm}mm` : '-',
      color: 'text-trigger-rain',
    },
    {
      key: 'snow',
      Icon: Snowflake,
      label: '눈',
      value: data?.snow ? '내림' : '없음',
      color: 'text-trigger-cold',
    },
    {
      key: 'pm25',
      Icon: Wind,
      label: 'PM2.5',
      value: data?.pm25 != null ? data.pm25.toFixed(0) : '-',
      color: 'text-trigger-dust',
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

  // 옵션 B: 외부 div가 min-w로 헤더 폭 점프 방지, Link 자체는 자연 폭
  // → 클릭/hover 영역이 글자 폭에 딱 맞음
  // hover는 opacity로 — color 토큰을 덮어쓰지 않도록
  return (
    <div className="flex min-w-[8rem] items-center">
      <Link
        href="/weather"
        aria-label="날씨 현황 보기"
        className="flex items-center gap-1 text-sm transition-opacity hover:opacity-80"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={current.key}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1 ${current.color}`}
          >
            <Icon className="h-4 w-4" />
            <span>
              {current.label} {current.value}
            </span>
          </motion.span>
        </AnimatePresence>
      </Link>
    </div>
  )
}
