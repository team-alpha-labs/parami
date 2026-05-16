// /payment/complete — 결제 confirm 성공 후 도달하는 정적 안내 페이지
// /payment의 success 모드에서 router.replace로 이동시키며, 직접 접근해도 동일 화면 노출
// API 호출 없음 (실제 결제 처리는 /payment success 콜백에서 이미 끝남)

import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '결제 완료 — Parami',
}

const NEXT_STEPS = [
  '결제가 활성화됐어요',
  '날씨 모니터링이 시작됐어요',
  '트리거 조건 충족 시 자동 보상 지급돼요',
] as const

export default function PaymentCompletePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <CheckCircle2 className="mx-auto h-20 w-20 text-success" strokeWidth={1.5} />

      <h1 className="mt-6 text-3xl font-bold text-foreground">결제 완료!</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
        Parami 결제가 정상적으로 완료됐어요.
        <br />
        이제 날씨 조건이 충족되면 자동으로 보상금을 받을 수 있어요.
      </p>

      <div className="mt-8 rounded-lg bg-primary/5 p-6 text-left">
        <p className="font-semibold text-foreground">다음 단계</p>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          {NEXT_STEPS.map((step) => (
            <li key={step} className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/mypage">마이페이지로 이동</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/weather">날씨 확인하기 ↗</Link>
        </Button>
      </div>
    </div>
  )
}
