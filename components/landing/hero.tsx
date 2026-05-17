// 랜딩 §1 — 히어로 섹션
// - 비 내리는 영상 배경 + 상단 카피 + 우하단 워드마크 + 좌하단 링크
// - LCP 우선 — framer-motion 미사용 (정적 서버 컴포넌트)
// - prefers-reduced-motion: 영상 숨기고 포스터 이미지만 표시
// - import: app/page.tsx
//
// TODO(yeojin): proxy.ts matcher가 /videos/*, /images/* 정적 자산을
// 가로채서 dev에서 로그인 리다이렉트 발생. 팀 협의 후 별도 처리.
// (랜딩 PR과 분리해 인프라 변경 별도 진행 예정)

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
      <div className="relative z-10 flex min-h-[600px] flex-col justify-between p-6 text-white md:min-h-[80svh] md:p-12">
        <h1 className="text-3xl font-medium md:text-5xl">비가 오는 날엔</h1>

        <div className="flex items-end justify-between gap-4">
          {/* TODO(yeojin): 상품 상세 페이지 라우트 확정 */}
          <Link
            href="#"
            className="text-sm underline-offset-4 hover:underline md:text-base"
          >
            △ 상품 상세설명
          </Link>

          <div className="text-right">
            <p className="text-3xl font-semibold md:text-5xl">Parami</p>
            <Link
              href="/login"
              className="mt-1 inline-block text-xs underline-offset-4 hover:underline md:text-sm"
            >
              로그인 / 메인페이지로 ↗
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
