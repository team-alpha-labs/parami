// TriggerCards — 보상 트리거 조건 5종 카드 섹션 (§6)
//   - 데이터 출처: lib/conditions.ts의 TRIGGER_CONDITIONS (snow 제외)
//   - 색 매핑: COLOR_MAP — 아이콘 박스에만 사용 (강조 라벨 칩은 회색 통일)
//   - 카드 내부 구조: 아이콘 → 제목/조건 → 구분선 → 평균/숫자 → 칩 → 설명
//   - 카드 내부 좌측 정렬, 그리드 컨테이너 mx-auto로 중앙
//   - 데스크탑도 가로 스크롤 (디자이너 판단, 시안 의도 반영)
//   - 사용처: app/page.tsx

import { CloudRain, CloudSnow, Sun, Thermometer, Wind } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeUp } from '@/components/motion/fade-up'
import { TRIGGER_CONDITIONS } from '@/lib/conditions'

const COLOR_MAP = {
  rain: { bg: 'bg-trigger-rain/10', text: 'text-trigger-rain' },
  heat: { bg: 'bg-trigger-heat/10', text: 'text-trigger-heat' },
  snow: { bg: 'bg-trigger-snow/10', text: 'text-trigger-snow' },
  cold: { bg: 'bg-trigger-cold/10', text: 'text-trigger-cold' },
  dust: { bg: 'bg-trigger-dust/10', text: 'text-trigger-dust' },
} as const

const TRIGGERS = [
  {
    key: 'rain',
    title: '강수',
    icon: CloudRain,
    threshold: `일 강수량 ${TRIGGER_CONDITIONS.rain}mm 이상`,
    monthlyDays: '4.0일',
    monthlyDetail: '7~8월 집중 (최대 6.8)',
    highlight: '예상치 못한 교통·소비 지출 ↑',
    description:
      '갑작스러운 비에 택시를 잡거나, 의도치 않게 옷이 더러워져 세탁비가 늘거나, 외출 일정을 취소하게 돼요. 우산을 챙기는 걸 깜빡했다면 편의점에서 또 소비하게 되죠.',
  },
  {
    key: 'heat',
    title: '폭염',
    icon: Sun,
    threshold: `최고기온 ${TRIGGER_CONDITIONS.heat}℃ 이상`,
    monthlyDays: '4.5일',
    monthlyDetail: '8월 최다 9.3일',
    highlight: '냉방비·실내 소비 증가 ↑',
    description:
      '33℃를 넘는 날은 밖에 나가는 것 자체가 고역이에요. 불쾌지수가 치솟고 열대야까지 이어지면 잠들기도 힘들죠. 컨디션이 무너지면 계획했던 루틴이 하나씩 밀리기 시작해요.',
  },
  {
    key: 'snow',
    title: '눈',
    icon: CloudSnow,
    threshold: '기상청 공식 관측 기준',
    monthlyDays: '4.2일',
    monthlyDetail: '1월 최다 8.4일',
    highlight: '이동 어려움·안전 위험 증가 ↑',
    description:
      '도로가 막히고 대중교통이 지연되고, 조심한다고 해도 미끄러운 길은 긴장을 놓을 수 없게 해요. 약속 시간을 맞추느라 허둥대고, 집에 돌아오면 신발과 옷이 엉망이 되어 있죠.',
  },
  {
    key: 'cold',
    title: '한파',
    icon: Thermometer,
    threshold: `최저기온 ${TRIGGER_CONDITIONS.cold}℃ 이하`,
    monthlyDays: '1.4일',
    monthlyDetail: '12~1월 집중',
    highlight: '난방비·이동 비용 증가 ↑',
    description:
      '너무 추워서 버스 정류장에 서 있는 것조차 힘든 날이에요. 패딩을 입어도 바람이 파고들고, 난방을 세게 틀면 요금 걱정이 따라와요. 그냥 집에만 있자니 하루가 통째로 사라지는 기분이죠.',
  },
  {
    key: 'dust',
    title: '미세먼지',
    icon: Wind,
    threshold: `PM2.5 ≥ ${TRIGGER_CONDITIONS.dust} μg/m³`,
    monthlyDays: '2.6일',
    monthlyDetail: '3~4월 집중 (최대 4.8일)',
    highlight: '건강 관리 비용·삶의 질 저하',
    description:
      '창문을 열 수도, 밖에 나갈 수도 없는 날이에요. 마스크를 써도 목이 칼칼하고, 공기청정기만 하루 종일 돌리게 돼요. 그냥 버티자니 하루가 통째로 답답해지는 기분이죠.',
  },
] as const

export function TriggerCards() {
  return (
    <FadeUp className="pt-16 pb-10 md:pt-24 md:pb-14">
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <p className="text-sm font-medium text-primary md:text-base">
          보상 조건
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-foreground md:text-4xl">
          어떤 날씨에 보상이 발동될까요?
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          기상청 공식 API가 조건을 자동으로 감지해요. 신청 없이 자동으로 들어와요.
        </p>
      </div>

      <div
        className="mx-auto mt-10 flex max-w-5xl snap-x snap-mandatory gap-4 overflow-x-auto custom-scrollbar px-6 pb-4
                   md:mt-14 md:gap-6 md:px-12"
      >
        {TRIGGERS.map(
          ({
            key,
            title,
            icon: Icon,
            threshold,
            monthlyDays,
            monthlyDetail,
            highlight,
            description,
          }) => {
            const color = COLOR_MAP[key]
            return (
              <Card
                key={key}
                className="w-[280px] shrink-0 snap-start border-border/50 p-6 shadow-md"
              >
                {/* 1. 아이콘 박스 */}
                <div
                  className={`mb-3 inline-flex rounded-lg p-3 ${color.bg}`}
                >
                  <Icon className={`h-6 w-6 ${color.text}`} aria-hidden />
                </div>

                {/* 2. 제목 + 조건 */}
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {threshold}
                </p>

                {/* 3. 구분선 */}
                <div className="my-4 border-t border-border" />

                {/* 4. 평균 정보 + 큰 숫자 */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    서울 월 평균
                  </span>
                  <span className="text-3xl font-bold text-foreground md:text-4xl">
                    {monthlyDays}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{monthlyDetail}</p>

                {/* 5. 강조 라벨 칩 — 회색 통일 (카드별 컬러 X) */}
                <div className="mt-4">
                  <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {highlight}
                  </span>
                </div>

                {/* 6. 설명문 */}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </Card>
            )
          },
        )}
      </div>
    </FadeUp>
  )
}
