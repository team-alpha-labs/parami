// /pricing — 요금제 페이지 (PricingSection + 하단 CTA)
// 하단 CTA는 페이지 전용 — 여진 랜딩에선 별도 위치라 PricingSection 안에 두지 않음

import type { Metadata } from 'next'
import Link from 'next/link'
import { PricingSection } from '@/components/pricing-section'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '요금제 — Parami',
  description: '베이직·스탠다드·프리미엄 3티어 중 선택해 월 보상금을 받아보세요.',
}

export default function PricingPage() {
  return (
    <div className="bg-muted/30">
      <PricingSection />

      <section className="mx-auto max-w-3xl px-6 pb-20 pt-8 text-center">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          보상받을 준비가 되셨나요?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          이메일 주소를 입력하고 시작하세요! 월 7,400원부터 시작해요
        </p>
        <Button asChild variant="outline" size="lg" className="mt-6">
          <Link href="/signup">시작하기</Link>
        </Button>
      </section>
    </div>
  )
}
