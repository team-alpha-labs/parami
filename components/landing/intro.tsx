// Intro — Parami 소개 + 티어별 연간 기대액 (§3)
//   - 카드 UI → 가로 바 비교 구조 (시안 §3)
//   - 모바일: 세로 스택 + 가로 구분선 (divide-y)
//   - 데스크탑: 3등분 가로 바 + 세로 구분선 (md:grid-cols-3, md:divide-x md:divide-y-0)
//   - 사용처: app/page.tsx

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

        <div className="mt-10 grid grid-cols-1 divide-y-2 divide-border md:mt-14 md:grid-cols-3 md:divide-x-2 md:divide-y-0 md:border-x-2 md:border-border">
          {TIERS.map((tier) => (
            <div key={tier.name} className="px-6 py-6 text-center">
              <p className="text-lg font-semibold text-foreground md:text-xl">
                {tier.name} 기준
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
                {tier.amount}
                <span className="ml-1 text-base font-medium text-muted-foreground md:text-lg">
                  + a
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </FadeUp>
  )
}
