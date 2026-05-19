// CtaDecide — 결단 톤 CTA (§9, 회원가입 결단용)
//   - 톤: 단일 "시작하기" 버튼
//   - 인증 분기 (서버 컴포넌트 + getServerSession):
//       비로그인 → /signup
//       로그인   → /pricing (구독 중이면 PricingSection이 "현재 이용 중" 처리)
//   - vs Phase 4 (cta-explore.tsx): 탐색 톤, 2개 버튼 (상품 상세설명 + 요금제 바로가기)
//   - "월 7,400원"은 Basic 티어 구독료 (lib/conditions.ts엔 없음 — 시안 그대로 하드코딩)
//   - 사용처: app/page.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeUp } from '@/components/motion/fade-up'
import { getServerSession } from '@/lib/auth-server'

export async function CtaDecide() {
  const session = await getServerSession()
  const href = session ? '/pricing' : '/signup'

  return (
    <FadeUp className="px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold leading-tight text-foreground md:text-4xl">
          보상받을 준비가 되셨나요?
        </h2>
        <p className="mt-3 text-base text-muted-foreground md:mt-4 md:text-lg">
          이메일만 입력하면 바로 시작할 수 있어요. 월 7,400원부터 시작해요
        </p>

        <div className="mt-6 flex justify-center md:mt-8">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-[13px] border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Link href={href}>시작하기</Link>
          </Button>
        </div>
      </div>
    </FadeUp>
  )
}
