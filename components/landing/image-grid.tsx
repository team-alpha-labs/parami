// 랜딩 §2 — 이미지 그리드 (5장 사진 + 큰 메시지)
// - 모바일: 1열 세로 스택 / 데스크탑: 2열 × 3행 그리드 (메시지가 좌중앙)
// - 비(우중) 사진만 세로형(aspect-[3/4]) → 같은 행 높이가 자동으로 커져 시안의 큰 사진 효과 달성
// - 나머지 4장은 정사각형(aspect-square)
// - next/image fill 모드 + object-cover
// - FadeUp으로 스크롤 진입 모션
// - import: app/page.tsx
//
// 실제 자산 경로: public/images/landing/weather-{snow|sunny|rain|cold|heat}.png
//   정사각 4장 (눈/맑음/한파/폭염) + 세로형 1장 (비, 3:4)
//   TODO(후속): PNG → JPEG/WebP 변환으로 용량 절감 (현재 99~302KB)
//   파일 없어도 빌드/런타임 안 깨짐 (404만 뜨고 회색 박스만 보임)

import Image from 'next/image'
import { FadeUp } from '@/components/motion/fade-up'

interface PhotoProps {
  src: string
  caption: string
  sub: string
  boxClassName?: string
}

function Photo({
  src,
  caption,
  sub,
  boxClassName = 'aspect-square',
}: PhotoProps) {
  const alt = `${caption} — ${sub}`
  return (
    <figure>
      <div
        className={`relative w-full overflow-hidden bg-muted ${boxClassName}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <figcaption className="mt-4">
        <p className="text-lg font-semibold text-foreground md:text-xl">
          {caption}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </figcaption>
    </figure>
  )
}

function Message() {
  return (
    <div className="flex items-center">
      <h2 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
        날씨에 맞추어
        <br />
        보상금과 혜택이 쏟아져요
      </h2>
    </div>
  )
}

export function ImageGrid() {
  return (
    <div id="image-grid">
      <FadeUp className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-12">
          <Photo
            src="/images/landing/weather-snow.png"
            caption="눈오는 날"
            sub="기상청 공식 관측 기준"
            boxClassName="aspect-[3/4]"
          />
          <Photo
            src="/images/landing/weather-sunny.png"
            caption="맑은 날"
            sub="봄, 가을 미세먼지 좋음, 강수 1mm 이하"
          />
          <Message />
          <Photo
            src="/images/landing/weather-rain.png"
            caption="비오는 날"
            sub="일 강수량 3mm 이상"
          />
          <Photo
            src="/images/landing/weather-cold.png"
            caption="한파"
            sub="최저기온 -12℃ 이하"
          />
          <Photo
            src="/images/landing/weather-heat.png"
            caption="폭염"
            sub="최고기온 33℃ 이상"
            boxClassName="aspect-[5/6]"
          />
          </div>
        </div>
      </FadeUp>
    </div>
  )
}
