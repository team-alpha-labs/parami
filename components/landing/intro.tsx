// 랜딩 §3 — Parami 소개 + 티어별 연간 기대액
// - 라벨 / 헤더 / 본문 + 티어 카드 3개 (Basic / Standard / Premium)
// - 카드 부제 "연간 수령 기대액" — 사용자 이해 보조
// - 시안에 Standard 강조 없음 → 3장 통일 스타일
// - FadeUp 스크롤 진입 모션
// - import: app/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { FadeUp } from '@/components/motion/fade-up'

const TIERS = [
  { name: 'Basic', amount: '90,700원' },
  { name: 'Standard', amount: '158,600원' },
  { name: 'Premium', amount: '260,600원' },
] as const

export function Intro() {
  return (
    <FadeUp className="px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary md:text-base">
          Parami란?
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-foreground md:text-4xl">
          날씨 기반 자동 보상 — 새로운 개념의 보험
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          Parami는 날씨가 기준을 넘으면 보상금이 자동 지급되는 날씨 보험입니다.
          <br />
          어려운 약관도, 설계사 상담도, 긴 서류도 없습니다.
        </p>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-6">
          {TIERS.map((tier) => (
            <Card key={tier.name} className="text-center">
              <CardHeader className="pb-2">
                <CardDescription>{tier.name} 기준</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground md:text-4xl">
                  {tier.amount}
                  <span className="ml-1 text-lg font-medium text-muted-foreground md:text-xl">
                    + a
                  </span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  연간 수령 기대액
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}
