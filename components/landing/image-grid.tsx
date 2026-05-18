// 랜딩 §2 — 이미지 그리드 (5장 사진 + 큰 메시지, 비대칭 레이아웃)
// - 모바일: 세로 스택 (단순 flex column)
// - 데스크탑: 12-col 그리드에 명시적 col-start/col-span/row-start로 비대칭 배치
//   (시안 비례: 좌측 사진들은 위/아래, 우측 사진들은 살짝 오프셋, rain은 세로 길게, heat은 크게)
// - import: app/page.tsx
//
// 자산 경로: public/images/landing/weather-{snow|sunny|rain|cold|heat}.jpg
// 권장 사진 스펙:
//   snow (3:4):  900×1200 이상
//   sunny (1:1): 1200×1200 이상
//   rain (3:4):  900×1200 이상
//   cold (1:1):  1200×1200 이상
//   heat (5:6):  1000×1200 이상
// TODO(후속): JPEG 추가 압축으로 용량 절감 (현재 0.4~3.2MB → 목표 ≤200KB)
// 파일 없어도 빌드/런타임 안 깨짐 (404만 뜨고 회색 박스만 보임)

import Image from 'next/image'
import { FadeUp } from '@/components/motion/fade-up'

interface PhotoProps {
  src: string
  caption: string
  sub: string
  aspect?: string
  className?: string
}

function Photo({
  src,
  caption,
  sub,
  aspect = 'aspect-square',
  className,
}: PhotoProps) {
  const alt = `${caption} — ${sub}`
  return (
    <figure className={className}>
      <div className={`relative w-full overflow-hidden bg-muted ${aspect}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
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

function Message({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className ?? ''}`}>
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
        <div className="mx-auto max-w-5xl">
          {/*
            모바일: 단순 세로 스택
            데스크탑(md+): 12-col × auto-row 그리드, 각 셀 명시 배치로 비대칭
          */}
          <div className="flex flex-col gap-10 md:grid md:grid-cols-12 md:auto-rows-auto md:gap-x-6 md:gap-y-10">
            <Photo
              src="/images/landing/weather-snow.jpg"
              caption="눈오는 날"
              sub="기상청 공식 관측 기준"
              aspect="aspect-[3/4]"
              className="md:col-start-1 md:col-span-5 md:row-start-1 md:row-span-2"
            />
            <Photo
              src="/images/landing/weather-sunny.jpg"
              caption="맑은 날"
              sub="봄, 가을 미세먼지 좋음, 강수 1mm 이하"
              aspect="aspect-square"
              className="md:col-start-8 md:col-span-4 md:row-start-2 md:row-span-2"
            />
            <Message className="md:col-start-1 md:col-span-7 md:row-start-3 md:row-span-2" />
            <Photo
              src="/images/landing/weather-rain.jpg"
              caption="비오는 날"
              sub="일 강수량 3mm 이상"
              aspect="aspect-[3/4]"
              className="md:col-start-8 md:col-span-5 md:row-start-4 md:row-span-3"
            />
            <Photo
              src="/images/landing/weather-cold.jpg"
              caption="한파"
              sub="최저기온 -12℃ 이하"
              aspect="aspect-square"
              className="md:col-start-2 md:col-span-4 md:row-start-6 md:row-span-2"
            />
            <Photo
              src="/images/landing/weather-heat.jpg"
              caption="폭염"
              sub="최고기온 33℃ 이상"
              aspect="aspect-[5/6]"
              className="md:col-start-7 md:col-span-6 md:row-start-7 md:row-span-3"
            />
          </div>
        </div>
      </FadeUp>
    </div>
  )
}
