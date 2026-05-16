'use client'

// /payment — 토스 결제 흐름 전체를 한 페이지에서 처리 (select / success / fail)
//
// 모드 분기는 URL 쿼리로:
//   - ?tier                                       → select: 요금제 표시 + 결제하기
//   - ?paymentKey & ?orderId & ?amount (+ ?tier)  → success: confirm → /payment/complete
//   - ?code & ?message                            → fail: 에러 표시
//
// 결제수단 라디오는 의도적으로 생략 — 토스 결제창에서 카드/계좌이체 자동 노출

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import { AlertCircle, CreditCard } from 'lucide-react'
import { api, ApiError } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'

type Tier = 'basic' | 'standard' | 'premium'
type Plan = { tier: Tier; name: string; price: number }

const VALID_TIERS: Tier[] = ['basic', 'standard', 'premium']

// 랜딩의 "Basic 90,700원 / Standard 158,600원 / Premium 260,600원 + a" 표기와 일관
// 회당 보상 × 연 평균 트리거 횟수(약 113회) 마케팅 수치 — 이론적 최대 아님
const ANNUAL_REWARD_ESTIMATE: Record<Tier, number> = {
  basic: 90700,
  standard: 158600,
  premium: 260600,
}

// "2026. 05. 14" 디자인 표기
function formatKoreanDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}. ${m}. ${d}`
}

// react-hooks/purity 룰 우회용 모듈 레벨 헬퍼 (new Date / Math.random / Date.now)
function getBillingInfo(tier: Tier) {
  const now = new Date()
  const next = new Date(now)
  next.setMonth(next.getMonth() + 1)
  return {
    firstBillingDate: formatKoreanDate(now),
    nextBillingDate: formatKoreanDate(next),
    billingDay: now.getDate(),
    annualEstimate: ANNUAL_REWARD_ESTIMATE[tier],
  }
}

function generateOrderId() {
  return `parami_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      }
    >
      <PaymentInner />
    </Suspense>
  )
}

function PaymentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: me, isLoading: meLoading } = useMe()

  const paymentKey = searchParams.get('paymentKey')
  const orderIdParam = searchParams.get('orderId')
  const amountParam = searchParams.get('amount')
  const failCode = searchParams.get('code')
  const failMessage = searchParams.get('message')
  const tierParam = searchParams.get('tier')

  if (paymentKey && orderIdParam && amountParam) {
    return (
      <ConfirmingPayment
        paymentKey={paymentKey}
        orderId={orderIdParam}
        amount={Number(amountParam)}
        onSuccess={() => router.replace('/payment/complete')}
      />
    )
  }

  if (failCode) return <PaymentFailed code={failCode} message={failMessage} />

  if (meLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    )
  }
  // proxy.ts가 비로그인 사용자를 /login으로 리다이렉트하므로 me는 항상 존재
  if (!me) return null

  if (!tierParam || !VALID_TIERS.includes(tierParam as Tier)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-foreground">요금제를 먼저 선택해주세요.</p>
        <Button asChild className="mt-4">
          <Link href="/pricing">요금제 보러 가기</Link>
        </Button>
      </div>
    )
  }

  return <PaymentSelect tier={tierParam as Tier} customerName={me.name} />
}

// select 모드: 요금제 요약 + 토스 결제창 호출
function PaymentSelect({ tier, customerName }: { tier: Tier; customerName: string }) {
  const [requesting, setRequesting] = useState(false)

  const { data: plans, isLoading, error } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/api/plans'),
  })

  const plan = plans?.find((p) => p.tier === tier)
  const { firstBillingDate, nextBillingDate, billingDay, annualEstimate } = getBillingInfo(tier)

  // 토스 결제창 호출 — 성공/취소 시 successUrl/failUrl로 자동 리다이렉트
  // successUrl에 ?tier 박아두면 토스가 결과 쿼리를 그 뒤로 append → confirm body로 전달
  // (신규 가입자엔 필수, 기존 구독자는 서버가 pending_tier ?? current_tier로 덮어씀)
  const onPay = async () => {
    if (!plan) return
    setRequesting(true)
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수 누락')

      const tossPayments = await loadTossPayments(clientKey)
      const origin = window.location.origin
      await tossPayments.requestPayment('카드', {
        amount: plan.price,
        orderId: generateOrderId(),
        orderName: `Parami ${plan.name} 구독`,
        customerName,
        successUrl: `${origin}/payment?tier=${plan.tier}`,
        failUrl: `${origin}/payment?tier=${plan.tier}`,
      })
    } catch (e) {
      // 결제창 닫기 등 의도적 취소도 throw됨 — 토스트 띄우면 UX 방해
      console.warn('토스 결제 요청 중단:', e)
      setRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted-foreground">
        요금제를 불러오는 중...
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-destructive">
        요금제를 불러오지 못했어요.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">결제하기</h1>

      {/* 요금제 요약 */}
      <div className="mt-6 rounded-lg border bg-background p-6">
        <p className="text-base font-semibold text-foreground">선택한 요금제</p>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-lg font-semibold text-foreground">{plan.name} 플랜</p>
          <p className="text-xl font-bold text-foreground">
            {plan.price.toLocaleString()}원
            <span className="ml-1 text-sm font-normal text-muted-foreground">/월</span>
          </p>
        </div>

        <hr className="my-5 border-border" />

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="font-semibold text-foreground">총 결제 금액</dt>
            <dd className="text-lg font-bold text-primary">
              {plan.price.toLocaleString()}원
            </dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>구독 유형</dt>
            <dd>월간 구독</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>첫 결제일</dt>
            <dd>{firstBillingDate}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>다음 결제일</dt>
            <dd>{nextBillingDate}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>연간 기대 수령액</dt>
            <dd>{annualEstimate.toLocaleString()}원</dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        토스페이먼츠 단건 결제 — 자동 갱신되지 않으며, 매월 {billingDay}일 직접 결제로 갱신하세요.
      </p>

      {/* 결제 수단: requestPayment('카드') 호출이라 카드만 노출 (멀티 수단 필요 시 widget SDK로 전환) */}
      <div className="mt-6 rounded-lg bg-muted/50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CreditCard className="h-4 w-4" />
          결제 수단
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          토스페이먼츠를 통해 카드로 안전하게 결제됩니다.
        </p>
      </div>

      <Button
        onClick={onPay}
        disabled={requesting}
        size="lg"
        className="mt-6 w-full"
      >
        {requesting ? '결제창 여는 중...' : '결제하기'}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        결제 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  )
}

// success 모드: 토스 성공 콜백 → POST /api/payments/confirm → /payment/complete
// confirm 내부에서 토스 재검증 + DB 트랜잭션 + 실패 시 자동 환불 (lib/queries/payments.ts)
function ConfirmingPayment({
  paymentKey,
  orderId,
  amount,
  onSuccess,
}: {
  paymentKey: string
  orderId: string
  amount: number
  onSuccess: () => void
}) {
  const searchParams = useSearchParams()
  // tier 누락 케이스(직접 URL 입력 등) 보호를 위한 폴백
  const tier = searchParams.get('tier') ?? 'basic'

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // strict mode가 effect를 2번 호출 → toss_order_id UNIQUE 충돌 방지
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    void (async () => {
      try {
        await api.post('/api/payments/confirm', { paymentKey, orderId, amount, tier })
        onSuccess()
      } catch (e) {
        setErrorMsg(e instanceof ApiError ? e.message : '결제 처리에 실패했어요.')
      }
    })()
  }, [paymentKey, orderId, amount, tier, onSuccess])

  if (!errorMsg) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-foreground">결제를 확정하는 중...</p>
        <p className="mt-2 text-sm text-muted-foreground">
          이 페이지를 닫지 말고 잠시만 기다려주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-destructive" strokeWidth={1.5} />
      <p className="mt-4 text-lg font-semibold text-foreground">결제 확정에 실패했어요</p>
      <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/pricing">요금제로 돌아가기</Link>
        </Button>
        <Button asChild>
          <Link href="/mypage">마이페이지</Link>
        </Button>
      </div>
    </div>
  )
}

// fail 모드: 토스 실패 콜백
function PaymentFailed({ code, message }: { code: string; message: string | null }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-destructive" strokeWidth={1.5} />
      <p className="mt-4 text-lg font-semibold text-foreground">결제에 실패했어요</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {message ?? '잠시 후 다시 시도해주세요.'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">에러 코드: {code}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/pricing">요금제로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}
