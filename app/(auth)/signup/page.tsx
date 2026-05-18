'use client'

// /signup — 이름 + 이메일 + 비밀번호 + 약관 동의 (디자인의 2단계를 1페이지로 통합)
// 분배표 지시: 주민번호·휴대폰번호는 수집 안 함 (백엔드에도 필드 없음)
// 약관 동의는 클라이언트 검증만 — 백엔드에 동의 컬럼 없어 저장 X
//
// 가입 성공 → 자동 로그인(POST /api/auth/login) → /home

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { api, ApiError } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type AgreementKey = 'marketing' | 'service' | 'privacy' | 'location'

type Agreement = {
  key: AgreementKey
  label: string
  required: boolean
  description: string
}

const AGREEMENTS: Agreement[] = [
  {
    key: 'marketing',
    label: '마케팅 수신 동의',
    required: false,
    description:
      '서비스 이용에는 불이익이 없으며, 언제든지 설정에서 수신 거부가 가능합니다.',
  },
  {
    key: 'service',
    label: '서비스 이용약관',
    required: true,
    description:
      '회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.',
  },
  {
    key: 'privacy',
    label: '개인정보 처리방침',
    required: true,
    description:
      '언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있으며, 개인정보 처리에 관한 문의는 개인정보 보호책임자에게 연락할 수 있습니다.',
  },
  {
    key: 'location',
    label: '위치정보 이용 동의',
    required: true,
    description:
      '위치정보는 날씨 데이터와 결합하여 맞춤형 보장 서비스를 제공하는 데 활용됩니다.',
  },
]

export default function SignupPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreed, setAgreed] = useState<Record<AgreementKey, boolean>>({
    marketing: false,
    service: false,
    privacy: false,
    location: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const passwordMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm

  const requiredAllAgreed = AGREEMENTS.filter((a) => a.required).every(
    (a) => agreed[a.key],
  )
  const allAgreed = AGREEMENTS.every((a) => agreed[a.key])

  const canSubmit = useMemo(
    () =>
      name &&
      email &&
      password.length >= 8 &&
      password === passwordConfirm &&
      requiredAllAgreed &&
      !submitting,
    [name, email, password, passwordConfirm, requiredAllAgreed, submitting],
  )

  const toggleAll = () => {
    const next = !allAgreed
    setAgreed({ marketing: next, service: next, privacy: next, location: next })
  }

  const toggleOne = (key: AgreementKey) =>
    setAgreed((prev) => ({ ...prev, [key]: !prev[key] }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/auth/signup', { name, email, password })
      // 자동 로그인 — 사용자가 가입 후 로그인 다시 안 하도록
      await api.post('/api/auth/login', { email, password })
      // useMe 무효화 + RSC Header 갱신 (logout-button과 동일 패턴)
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/home')
      router.refresh()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '회원가입에 실패했어요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border bg-background p-8 md:p-10">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">계정 만들기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          파라미 가입을 위해 기본 정보를 입력해 주세요
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-destructive">
                비밀번호는 8자 이상이어야 해요.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
            {passwordMismatch && (
              <p className="text-xs text-destructive">
                비밀번호가 일치하지 않아요.
              </p>
            )}
          </div>

          {/* 약관 동의 */}
          <div className="space-y-3">
            <Label>약관 동의</Label>

            {/* 전체 동의 */}
            <button
              type="button"
              onClick={toggleAll}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors',
                allAgreed
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-muted/50',
              )}
            >
              <span className="flex items-center gap-2">
                <CheckBox checked={allAgreed} />
                <span className="font-semibold text-foreground">전체 동의하기</span>
              </span>
              {allAgreed && (
                <span className="text-xs font-medium text-primary">완료</span>
              )}
            </button>

            {/* 개별 약관 */}
            {AGREEMENTS.map((a) => (
              <div
                key={a.key}
                className="rounded-lg border border-input p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{a.label}</p>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      a.required ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {a.required ? '필수' : '선택'}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {a.description}
                </p>
                <button
                  type="button"
                  onClick={() => toggleOne(a.key)}
                  className="mt-3 flex items-center gap-2 text-sm text-foreground"
                >
                  <CheckBox checked={agreed[a.key]} />
                  <span>{a.label}에 동의해요</span>
                </button>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
          >
            {submitting ? '가입 중...' : '가입 완료하기'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
        checked ? 'border-primary bg-primary' : 'border-input bg-background',
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
    </span>
  )
}
