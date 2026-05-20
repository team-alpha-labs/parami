// 랜딩 페이지 진입점 (담당: 여진)
// §1~§9 섹션을 components/landing/*에서 import해 조립
// 디자인: docs/figma/consumer/landing.png
// 가이드: docs/frontend-guide.md
//
// 섹션 매핑 (§2/§3 swap + §3/§4 swap 누적됨 — 컴포넌트 파일 헤더 주석은 추후 정리 예정):
//   §1 Hero            — components/landing/hero.tsx
//   §2 CtaExplore      — components/landing/cta-explore.tsx  (구 §3, 그 전 §4)
//   §3 ImageGrid       — components/landing/image-grid.tsx   (구 §2)
//   §4 Intro           — components/landing/intro.tsx        (구 §3)
//   §5 Compare         — components/landing/compare.tsx
//   §6 TriggerCards    — components/landing/trigger-cards.tsx
//   §7 GoodWeather     — components/landing/good-weather.tsx
//   §8 PricingSection  — components/pricing-section.tsx (소라 작업)
//   §9 CtaDecide       — components/landing/cta-decide.tsx
//
// app/layout.tsx가 Header/Footer/<main>을 wrap하므로 페이지에선 본문 섹션만 둠.

import { Hero } from '@/components/landing/hero'
import { ImageGrid } from '@/components/landing/image-grid'
import { CtaExplore } from '@/components/landing/cta-explore'
import { Intro } from '@/components/landing/intro'
import { Compare } from '@/components/landing/compare'
import { TriggerCards } from '@/components/landing/trigger-cards'
import { GoodWeather } from '@/components/landing/good-weather'
import { CtaDecide } from '@/components/landing/cta-decide'
import { PricingSection } from '@/components/pricing-section'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <CtaExplore />
      <ImageGrid />
      <Intro />
      <Compare />
      <TriggerCards />
      <GoodWeather />

      {/* §8 요금제 — components/pricing-section.tsx (소라 작업, main에 머지됨) */}
      {/* wrapper #pricing은 백업 앵커 (현재 §4 CTA는 /pricing 페이지로 이동) */}
      <section id="pricing">
        <PricingSection />
      </section>

      <CtaDecide />
    </>
  )
}
