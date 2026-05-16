// 랜딩 페이지 (담당: 여진)
// 디자인: docs/figma/consumer/landing.png
// 작업 시 docs/frontend-guide.md 참고

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold text-foreground">Parami</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        🚧 랜딩 페이지 — 여진 작업 예정 (docs/figma/consumer/landing.png)
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        프론트엔드 셋업 완료 — 페이지 작성 시 위 디자인 참조 + docs/frontend-guide.md 가이드 따를 것
      </p>
    </div>
  )
}
