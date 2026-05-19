// GoodWeather — 맑은 날 보너스 안내 박스 (§7)
//   - 데이터 출처: lib/conditions.ts의 GOOD_WEATHER_CONDITIONS
//   - 박스: max-w-4xl 컴팩트, §6 카드와 톤 통일 (border-border/50 + shadow-md)
//   - 아이콘: Sun(text-trigger-dust 앰버) + Wind(text-trigger-rain 파랑)
//   - 사용처: app/page.tsx

import { Sun, Wind } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeUp } from '@/components/motion/fade-up'
import { GOOD_WEATHER_CONDITIONS } from '@/lib/conditions'

export function GoodWeather() {
  const months = GOOD_WEATHER_CONDITIONS.months.join('·')

  return (
    <FadeUp className="px-6 pb-20 md:px-12 md:pb-28">
      <Card className="mx-auto max-w-4xl border-border/50 p-5 shadow-md md:p-6">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex shrink-0 items-center gap-1">
            <Sun
              className="h-6 w-6 text-trigger-dust md:h-7 md:w-7"
              aria-hidden
            />
            <Wind
              className="h-6 w-6 text-trigger-rain md:h-7 md:w-7"
              aria-hidden
            />
          </div>
          <div>
            <p className="font-semibold text-foreground md:text-base">
              맑은 날 보너스: 월 평균 3일
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
              강수 {GOOD_WEATHER_CONDITIONS.rain_max}mm 이하 + PM2.5 ≤{' '}
              {GOOD_WEATHER_CONDITIONS.dust_max} + 풍속 ≤{' '}
              {GOOD_WEATHER_CONDITIONS.wind_max}m/s — 세 조건이 모두 맞으면
              보상금을 드려요. 봄·가을에 적용돼요 ({months}월)
            </p>
          </div>
        </div>
      </Card>
    </FadeUp>
  )
}
