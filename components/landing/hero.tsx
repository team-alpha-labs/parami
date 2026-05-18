// 랜딩 §1 — 히어로 섹션
// - 비 내리는 영상 배경 + 상단 카피 + 우하단 워드마크 + 좌하단 링크
// - LCP 우선 — framer-motion 미사용 (정적 서버 컴포넌트)
// - prefers-reduced-motion: 영상 숨기고 포스터 이미지만 표시
// - import: app/page.tsx

import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-[600px] w-full overflow-hidden bg-muted md:min-h-[80svh]">
      {/*
        영상 배경 — motion-safe에서만 표시
        TODO(yeojin): public/videos/rain-hero.mp4 추가 필요
        (권장: ≤2MB, 1280x720, H.264 — 큰 파일은 LCP 저해)
      */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/rain-hero-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
      >
        <source src="/videos/rain-hero.mp4" type="video/mp4" />
      </video>

      {/*
        포스터 이미지 fallback — motion-reduce일 때만 표시
        TODO(yeojin): public/images/rain-hero-poster.jpg 추가 필요
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/rain-hero-poster.jpg"
        alt=""
        className="absolute inset-0 hidden h-full w-full object-cover motion-reduce:block"
      />

      {/* 가독성용 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/30" aria-hidden />

      {/* 텍스트 레이어 */}
      <div className="relative z-10 flex min-h-[600px] flex-col p-6 text-white md:min-h-[80svh] md:p-12">
        <h1 className="text-3xl font-extrabold md:text-5xl">비가 오는 날엔</h1>

        {/* 하단 영역: 우하단 워드마크/링크 + 하단 중앙 상품 상세설명 */}
        <div className="mt-auto">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-3xl font-extrabold md:text-5xl">Parami</p>
              <div className="mt-1 flex justify-end text-xs text-white/80 md:text-sm">
                <Link
                  href="/home"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  메인페이지로 ↗
                </Link>
              </div>
            </div>
          </div>

          {/* 하단 중앙 — 상품 상세설명 (§2 ImageGrid 앵커) */}
          {/* native <a>로 사용 — Next.js <Link>의 hash-only navigation 불안정 우회 */}
          <div className="mt-6 text-center md:mt-10">
            <a
              href="#image-grid"
              className="text-base font-medium underline-offset-4 hover:underline md:text-lg"
            >
              ▽ 상품 상세설명
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
