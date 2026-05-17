// GoodWeather — 맑은 날 보너스 안내 박스 (§7)
//   - 데이터 출처: lib/conditions.ts의 GOOD_WEATHER_CONDITIONS
//   - 단일 가로 박스, 좌측 아이콘 + 우측 카피/조건
//   - §6 조건 카드 섹션과 톤 통일 (Card + border-border/50 + shadow-md + bg-background)
//   - 초록 강조는 아이콘에만 (text-trigger-good)
//   - ⚠️ Phase 10: 시안 아이콘이 노란/주황인데 우리는 초록 토큰만 있음 — 디자이너 협의
//   - 사용처: app/page.tsx

import { Sun, Wind } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeUp } from '@/components/motion/fade-up'
import { GOOD_WEATHER_CONDITIONS } from '@/lib/conditions'

export function GoodWeather() {
  const months = GOOD_WEATHER_CONDITIONS.months.join('·')

  return (
    <FadeUp className="px-6 pb-12 md:px-12 md:pb-16">
      <Card className="mx-auto max-w-7xl border-border/50 p-6 shadow-md md:p-8">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex shrink-0 items-center gap-1 text-trigger-good">
            <Sun className="h-8 w-8" aria-hidden />
            <Wind className="h-8 w-8" aria-hidden />
          </div>
          <div>
            <p className="font-bold text-foreground md:text-lg">
              맑은 날 보너스 (good_weather): 월 평균 3일
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              강수 {GOOD_WEATHER_CONDITIONS.rain_max}mm 이하 + PM2.5 ≤{' '}
              {GOOD_WEATHER_CONDITIONS.dust_max} + 풍속 ≤{' '}
              {GOOD_WEATHER_CONDITIONS.wind_max}m/s 세 조건 동시 충족 시 지급 —
              봄과 가을에 적용됩니다 ({months}월)
            </p>
          </div>
        </div>
      </Card>
    </FadeUp>
  )
}
