// 랜딩 §4 — 소개 CTA (탐색 톤)
// - 큰 카피 + 서브카피 + 버튼 2개 (상품 상세설명 강조 / 요금제 아웃라인)
// - 톤: 탐색용 2개 버튼 (소개 흐름 — 회원가입 결단 X)
//   vs Phase 9(cta-decide.tsx): 결단 톤, "시작하기" 단일 버튼 → /signup
// - FadeUp 스크롤 진입 모션
// - import: app/page.tsx

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeUp } from '@/components/motion/fade-up'

export function CtaExplore() {
  return (
    <FadeUp className="px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
          쉬운 날씨 보험,
          <br />
          Parami
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:mt-6 md:text-lg">
          날씨보험의 새 패러다임, Parami
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 md:mt-12 md:flex-row md:items-center">
          {/* 강조 버튼 — 상품 상세설명 (파란 채움) */}
          {/* TODO(yeojin): 상품 상세 페이지 라우트 확정 */}
          <Button asChild size="lg">
            <Link href="#">상품 상세설명 ↗</Link>
          </Button>

          {/* 아웃라인 버튼 — 요금제 (Phase 8 #pricing 앵커) */}
          <Button asChild size="lg" variant="outline">
            <Link href="#pricing">요금제 바로가기</Link>
          </Button>
        </div>
      </div>
    </FadeUp>
  )
}
