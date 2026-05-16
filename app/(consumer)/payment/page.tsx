'use client'

// /payment — 토스 결제 흐름 전체를 한 페이지에서 처리 (select / success / fail)
//
// 모드 분기는 URL 쿼리로 결정:
//   - ?tier=basic|standard|premium                → select: 요금제 표시 + 결제하기
//   - ?paymentKey & ?orderId & ?amount (+ ?tier)  → success: confirm 호출 → /payment/complete
//   - ?code & ?message                            → fail: 에러 표시 + 요금제로 돌아가기
//
// 결제수단 라디오는 의도적으로 생략 — 토스 결제창에서 카드/계좌이체가 자동 노출됨

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import { AlertCircle, CreditCard } from 'lucide-react'
import { api, ApiError } from '@/lib/client'
import { useMe } from '@/hooks/use-me'
import { Button } from '@/components/ui/button'

type Tier = 'basic' | 'standard' | 'premium'
const VALID_TIERS: Tier[] = ['basic', 'standard', 'premium']

type Plan = {
  id: number
  tier: Tier
  name: string
  price: number
  description: string | null
}

// plans.description("월 800원 보상금")에서 첫 숫자만 추출 — 연간 기대 수령액 계산용
// 파싱 실패 시 0 반환 (계산식이 0을 만들어 표시 자체가 사라짐 — annualEstimate > 0 가드)
function parseMonthlyRewardAmount(description: string | null): number {
  if (!description) return 0
  const match = description.match(/([\d,]+)/)
  if (!match) return 0
  return Number(match[1].replace(/,/g, ''))
}

// "2026. 05. 14" 형식 — 디자인 표기와 일치
function formatKoreanDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}. ${m}. ${d}`
}

// 다음 결제일 표시용 단순 +N개월 — 실제 next_billing_at은 confirm 후 백엔드가 결정 (UTC 기준)
function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
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

  // URL 쿼리에서 토스 콜백 / 요금제 선택 파라미터 추출
  const paymentKey = searchParams.get('paymentKey')
  const orderIdParam = searchParams.get('orderId')
  const amountParam = searchParams.get('amount')
  const failCode = searchParams.get('code')
  const failMessage = searchParams.get('message')
  const tierParam = searchParams.get('tier')

  // 한 페이지 3가지 분기 — paymentKey/code 유무로 토스 콜백 여부 판정
  const mode: 'success' | 'fail' | 'select' =
    paymentKey && orderIdParam && amountParam ? 'success' : failCode ? 'fail' : 'select'

  if (mode === 'success') {
    return (
      <ConfirmingPayment
        paymentKey={paymentKey!}
        orderId={orderIdParam!}
        amount={Number(amountParam)}
        onSuccess={() => router.replace('/payment/complete')}
      />
    )
  }

  if (mode === 'fail') {
    return <PaymentFailed code={failCode!} message={failMessage} />
  }

  // 이하 'select' 모드 — 요금제 선택해서 결제하기
  if (meLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    )
  }

  // proxy.ts가 비로그인 사용자를 /login으로 보내므로 정상 흐름에선 도달 X — 안전망
  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-foreground">로그인이 필요해요.</p>
        <Button asChild className="mt-4">
          <Link href="/login">로그인하러 가기</Link>
        </Button>
      </div>
    )
  }

  // tier 쿼리 누락/오타 케이스 — /pricing에서 정상적으로 넘어오면 항상 있음
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

// select 모드: 요금제 요약 표시 + 토스 결제창 호출
function PaymentSelect({ tier, customerName }: { tier: Tier; customerName: string }) {
  const [requesting, setRequesting] = useState(false)

  const {
    data: plans,
    isLoading,
    error,
  } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/api/plans'),
  })

  const plan = plans?.find((p) => p.tier === tier)

  // 첫/다음 결제일은 현재 시각 기준 클라이언트 표시용 (실제 next_billing_at은 백엔드가 UTC로 결정)
  // 연간 기대 수령액 = 월 보상금 × 월 캡(10회) × 12개월 — 이론적 최대치
  // (MAX_REWARD_PER_MONTH는 lib/conditions.ts와 동일 값. 디자인 표기 일치를 위해 클라이언트에서 계산)
  const { firstBillingDate, nextBillingDate, annualEstimate } = useMemo(() => {
    const now = new Date()
    const monthlyReward = parseMonthlyRewardAmount(plan?.description ?? null)
    return {
      firstBillingDate: formatKoreanDate(now),
      nextBillingDate: formatKoreanDate(addMonths(now, 1)),
      annualEstimate: monthlyReward * 10 * 12,
    }
  }, [plan?.description])

  // 결제하기 클릭 → 토스 결제창 호출
  // 토스 SDK가 결제창에서 결제 완료/취소를 감지해 successUrl/failUrl로 자동 리다이렉트시킴
  const onPay = async () => {
    if (!plan) return
    setRequesting(true)

    try {
      // 1) 토스 client key 확인 — NEXT_PUBLIC_ 접두 필수 (브라우저 노출용)
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      if (!clientKey) {
        throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수 누락')
      }

      // 2) 토스 SDK 로드 + orderId 생성 (UNIQUE 제약 충돌 방지 위해 timestamp + random)
      const tossPayments = await loadTossPayments(clientKey)
      const origin = window.location.origin
      const orderId = `parami_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      // 3) 결제창 호출 — '카드'는 초기 선택값이며 결제창에서 계좌이체 등 다른 수단으로 변경 가능
      // successUrl/failUrl에 ?tier 박아 두면 토스가 그 뒤로 paymentKey/orderId/amount를 append
      // → 콜백에서 그대로 confirm body로 전달 (신규 가입자엔 필수, 기존 구독자는 서버가 무시)
      await tossPayments.requestPayment('카드', {
        amount: plan.price,
        orderId,
        orderName: `Parami ${plan.name} 구독`,
        customerName,
        successUrl: `${origin}/payment?tier=${plan.tier}`,
        failUrl: `${origin}/payment?tier=${plan.tier}`,
      })
    } catch (e) {
      // 사용자가 결제창 닫기 등은 throw됨 — 토스트는 띄우지 않음 (의도적 취소까지 에러 표시하면 UX 방해)
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
          {annualEstimate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <dt>연간 기대 수령액</dt>
              <dd>{annualEstimate.toLocaleString()}원</dd>
            </div>
          )}
        </dl>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        매월 같은 날짜에 자동 결제됩니다. 언제든지 해지할 수 있습니다.
      </p>

      {/* 결제 수단 안내 (라디오 없음 — 토스 결제창에서 선택) */}
      <div className="mt-6 rounded-lg bg-muted/50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CreditCard className="h-4 w-4" />
          결제 수단
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          토스페이먼츠를 통해 안전하게 결제됩니다. 다음 화면에서 카드 또는 계좌이체를 선택할
          수 있습니다.
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

// success 모드: 토스 성공 콜백 → POST /api/payments/confirm → /payment/complete로 이동
// confirm 내부에서 토스 API 재검증 + DB 트랜잭션 + 실패 시 자동 환불까지 처리 (lib/queries/payments.ts)
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
  // tier는 select 모드에서 successUrl에 박아둔 값 — 신규 가입자는 필수, 기존 구독자는 서버 권위(pending_tier ?? current_tier)로 덮어씀
  // 누락 케이스(직접 URL 입력 등) 보호를 위해 'basic' 폴백
  const tier = searchParams.get('tier') ?? 'basic'

  const [status, setStatus] = useState<'pending' | 'error'>('pending')
  const [errorMsg, setErrorMsg] = useState('')

  // React strict mode가 dev에서 effect를 2번 실행 → confirm이 두 번 호출되어
  // 두 번째 요청이 toss_order_id UNIQUE 충돌로 실패하는 사고 방지
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    void (async () => {
      try {
        await api.post('/api/payments/confirm', {
          paymentKey,
          orderId,
          amount,
          tier,
        })
        onSuccess()
      } catch (e) {
        // confirm 실패: 토스 검증/금액 변조/DB 처리 등 다양한 원인 → 백엔드 메시지를 그대로 노출
        const msg = e instanceof ApiError ? e.message : '결제 처리에 실패했어요.'
        setErrorMsg(msg)
        setStatus('error')
      }
    })()
  }, [paymentKey, orderId, amount, tier, onSuccess])

  if (status === 'pending') {
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

// fail 모드: 토스 실패 콜백 — 에러 코드/메시지 표시 + 요금제로 돌아가기
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
