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

      {/* §8 요금제 — TODO(yeojin): components/pricing-section.tsx 머지되면 import로 교체 (담당: 소라/백2) */}
      {/* id="pricing" 필수 — Phase 4 CTA "요금제 바로가기" 앵커 타겟 */}
      <section id="pricing" className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-5xl rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          요금제 섹션 (소라 PR 머지 후 연결)
        </div>
      </section>

      <CtaDecide />
    </>
  )
}
