// Compare — 왜 Parami? 비교 섹션 (§5)
//   - 4가지 포인트 리스트 + 좌우 비교 카드 (우측 강조)
//   - 좌측 (기존 보험): 톤다운 (bg-muted/30, border-border/30, shadow-sm)
//   - 우측 (Parami): 영웅화 (border-2 border-primary, shadow-xl, md:scale-[1.03])
//   - 가운데 ArrowRight(데스크탑) / ArrowDown(모바일) — 좌→우 전환 명확
//   - 카드 폭 md:w-[340px] 고정 (정사각에 가까운 비율)
//   - 항목 li 자체를 박스화 (좌: bg-background/50, 우: bg-primary/5) + 좌측 정렬
//   - 사용처: app/page.tsx

import { ArrowDown, ArrowRight, Check, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FadeUp } from '@/components/motion/fade-up'

const POINTS = [
  ['가입이 쉽습니다', '이메일만 입력하면 끝. 심사도 상담도 없습니다.'],
  ['조건이 명확합니다', '"비 3mm 이상"처럼 숫자로 딱 떨어집니다.'],
  ['청구가 없습니다', '날씨 데이터로 자동 확인, 서류 제출 없음.'],
  ['보상이 빠릅니다', '조건 충족 즉시 잔액에 적립.'],
] as const

const COMPARE = {
  traditional: [
    '심사 및 서류 제출 필요',
    '애매한 보상 지급 조건',
    '피해 발생 후 직접 청구',
    '지급까지 수일~수주 소요',
  ],
  parami: [
    '청구·서류 제출 없음',
    '확실한 보상 지급 조건',
    '조건만 충족되면 자동 지급',
    '다음 영업일 이내 입금',
  ],
} as const

export function Compare() {
  return (
    <div id="compare">
      <FadeUp className="px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-foreground md:text-4xl">
          왜 Parami 인가요?
        </h2>

        <ol className="mt-6 space-y-3 md:mt-10 md:space-y-4">
          {POINTS.map(([title, body], i) => (
            <li key={title} className="text-base md:text-lg">
              <span className="text-foreground">
                {i + 1}. <span className="font-bold">{title}</span>
              </span>
              <span className="text-muted-foreground"> — {body}</span>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-10 flex max-w-4xl flex-col items-stretch gap-6 md:mt-14 md:flex-row md:items-center md:justify-center md:gap-8">
          {/* 좌측 카드 — 기존 보험 (톤다운) */}
          <Card className="w-full border-border/30 bg-muted/30 shadow-sm md:w-[340px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-muted-foreground md:text-2xl">
                기존 보험
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="space-y-3">
                {COMPARE.traditional.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-md bg-background/50 px-4 py-3 text-sm text-muted-foreground md:text-base"
                  >
                    <X
                      className="h-4 w-4 shrink-0 text-destructive"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 가운데 화살표 — 좌→우 전환 (모바일은 위→아래) */}
          <div
            className="flex shrink-0 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <ArrowRight className="hidden h-6 w-6 md:block" />
            <ArrowDown className="h-6 w-6 md:hidden" />
          </div>

          {/* 우측 카드 — Parami (영웅화) */}
          <Card className="w-full border-2 border-primary bg-background shadow-xl md:w-[340px] md:scale-[1.03]">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-primary md:text-3xl">
                Parami
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <ul className="space-y-3">
                {COMPARE.parami.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-md bg-primary/5 px-4 py-3 text-sm font-medium text-foreground md:text-base"
                  >
                    <Check
                      className="h-4 w-4 shrink-0 text-trigger-good"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeUp>
    </div>
  )
}
