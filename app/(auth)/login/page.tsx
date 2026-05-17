'use client'

// /login — 자체 JWT 로그인 (영현이 만든 POST /api/auth/login 사용)
// 성공 시 쿠키에 토큰 세팅됨 → useMe 무효화 + /home으로 push

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  // useSearchParams는 Suspense 안에서 호출해야 prerender 에러 안 남
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-6 py-12 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/auth/login', { email, password })
      // useMe 캐시 무효화 (클라이언트 컴포넌트) +
      // router.refresh() (서버 컴포넌트 Header는 쿠키를 직접 읽으므로 RSC 재실행 필요)
      await queryClient.invalidateQueries({ queryKey: ['me'] })

      // next 파라미터 open redirect 방지:
      //   - 내부 경로(/로 시작)만 허용
      //   - //로 시작하는 protocol-relative URL 차단 (//evil.com → 외부 호스트로 이동)
      const rawNext = searchParams.get('next')
      const next =
        rawNext?.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/home'
      router.push(next)
      router.refresh()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '로그인에 실패했어요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-center text-3xl font-bold text-foreground">로그인</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
