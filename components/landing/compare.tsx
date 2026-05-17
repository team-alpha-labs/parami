// 랜딩 §5 — 왜 Parami? 비교 섹션
// - 헤더 + 4가지 포인트 리스트(번호 매김) + 좌(기존 보험) vs 우(Parami) 비교 카드
// - 데스크탑: 카드 가로 2열 + 가운데 ChevronLeft
// - 모바일: 카드 세로 스택 + 분리자는 ChevronDown으로 토글 (위→아래 흐름 의미)
// - X 마크: text-destructive (빨강) / ✓ 마크: text-trigger-good (초록)
// - 우측 카드만 border-2 border-primary 강조
// - FadeUp 스크롤 진입 모션
// - import: app/page.tsx
//
// TODO(yeojin, phase-10): 카드 내부 리스트 좌우 패딩 비대칭 잔존.
//   - 시도한 것: flex justify-center + w-fit → mx-auto w-fit (.next 캐시 삭제 후에도 동일)
//   - 추가 시도 필요: (a) ul 폭을 명시적으로 잡기 (b) li flex justify-center로 li 자체 가운데
//   - 카드 헤더 크기도 작아 보임 (text-xl md:text-2xl 검토)
//   - 카드 수직 중앙 정렬도 미해결 (CardContent flex-1 items-center 패턴 검토)

import { Check, ChevronDown, ChevronLeft, X } from 'lucide-react'
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

        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-stretch gap-6 md:mt-14 md:flex-row md:gap-12">
          {/* 좌측: 기존 보험 (회색 톤다운) */}
          <Card className="flex-1 bg-muted">
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground md:text-xl">
                기존 보험
              </CardTitle>
            </CardHeader>
            <CardContent className="py-10">
              <ul className="mx-auto w-fit space-y-4">
                {COMPARE.traditional.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <X
                      className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                      aria-hidden
                    />
                    <span className="text-sm text-foreground md:text-base">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 가운데 분리자 — 데스크탑 < / 모바일 ∨ */}
          <div
            className="flex items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <ChevronLeft className="hidden h-12 w-12 md:block" />
            <ChevronDown className="h-12 w-12 md:hidden" />
          </div>

          {/* 우측: Parami (파란 테두리 강조) */}
          <Card className="flex-1 border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-lg text-primary md:text-xl">
                Parami
              </CardTitle>
            </CardHeader>
            <CardContent className="py-10">
              <ul className="mx-auto w-fit space-y-4">
                {COMPARE.parami.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-5 w-5 shrink-0 text-trigger-good"
                      aria-hidden
                    />
                    <span className="text-sm text-foreground md:text-base">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeUp>
  )
}
