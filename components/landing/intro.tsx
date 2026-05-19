// Intro — Parami 소개 + 월별 트리거 차트 (§4)
//   - 차트: 서울 2016~2026 기상 데이터 합산 area (recharts)
//   - id="intro" anchor — §3 CtaExplore "상품 상세설명" 버튼이 여기로 점프
//   - 사용처: app/page.tsx

import { FadeUp } from '@/components/motion/fade-up'
import { MonthlyTriggerChart } from '@/components/landing/monthly-trigger-chart'

export function Intro() {
  return (
    <div id="intro">
      <FadeUp className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-primary md:text-base">
            Parami란?
          </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-foreground md:text-4xl">
          날씨 기반 자동 보상 — 새로운 개념의 보험
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          Parami는 날씨가 기준을 넘으면 보상금을 자동으로 드리는 날씨 보험이에요.
          <br />
          어려운 약관도, 설계사 상담도, 긴 서류도 없어요.
        </p>

        {/* 핵심 stat — 좌측 액센트 바 (본문/티어 바 좌측 정렬과 연결) */}
        <div className="mt-8 border-l-4 border-primary pl-4 md:mt-10">
          <p className="text-lg font-bold text-foreground md:text-xl">
            월 평균 <span className="text-primary">9.5회</span> 자동 지급
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            트리거 5종 + 맑은 날 보너스 합산
          </p>
        </div>

          <MonthlyTriggerChart />
        </div>
      </FadeUp>
    </div>
  )
}
