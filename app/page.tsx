// 랜딩 페이지 진입점 (담당: 여진)
// §1~§9 섹션을 components/landing/*에서 import해 조립
// 디자인: docs/figma/consumer/landing.png
// 가이드: docs/frontend-guide.md
//
// 섹션 매핑:
//   §1 Hero            — components/landing/hero.tsx
//   §2 ImageGrid       — (Phase 2)
//   §3 Intro           — (Phase 3)
//   §4 CtaExplore      — (Phase 4)
//   §5 Compare         — (Phase 5)
//   §6 TriggerCards    — (Phase 6)
//   §7 GoodWeather     — (Phase 7)
//   §8 PricingSection  — (Phase 8 — 소라 PR 머지 후 components/pricing-section.tsx 연결)
//   §9 CtaDecide       — (Phase 9)
//
// app/layout.tsx가 Header/Footer/<main>을 wrap하므로 페이지에선 본문 섹션만 둠.

import { Hero } from '@/components/landing/hero'
import { ImageGrid } from '@/components/landing/image-grid'
import { Intro } from '@/components/landing/intro'
import { CtaExplore } from '@/components/landing/cta-explore'
import { Compare } from '@/components/landing/compare'
import { TriggerCards } from '@/components/landing/trigger-cards'
import { GoodWeather } from '@/components/landing/good-weather'
import { CtaDecide } from '@/components/landing/cta-decide'
import { PricingSection } from '@/components/pricing-section'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ImageGrid />
      <Intro />
      <CtaExplore />
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
