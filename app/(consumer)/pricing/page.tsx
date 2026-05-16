// /pricing — 요금제 페이지 (PricingSection 공통 컴포넌트를 감싼 얇은 라우트)
// proxy.ts에서 PUBLIC_PATHS로 지정되어 있어 비로그인도 접근 가능

import type { Metadata } from 'next'
import { PricingSection } from '@/components/pricing-section'

export const metadata: Metadata = {
  title: '요금제 — Parami',
  description: '베이직·스탠다드·프리미엄 3티어 중 선택해 월 보상금을 받아보세요.',
}

export default function PricingPage() {
  return (
    <div className="bg-muted/30">
      <PricingSection />
    </div>
  )
}
