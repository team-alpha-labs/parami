# 프론트엔드 작업 가이드

셋업이 끝나 페이지 작업 시작할 팀원용 가이드 (특히 프1 여진, 프2 명진).

---

## 0. 작업 시작 전 — 한 번만 (셋업)

```bash
# 1. main 최신화
git checkout main
git pull origin main

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000 열어서 셋업이 잘 작동하는지 확인
```

---

## 1. 새 페이지 만들기 — 위치

App Router 컨벤션. 라우트 그룹 `(auth)/(consumer)/(admin)`은 URL에 영향 X (경로 단순 묶음).

| URL | 파일 위치 |
| --- | --- |
| `/login` | `app/(auth)/login/page.tsx` |
| `/signup` | `app/(auth)/signup/page.tsx` |
| `/home` | `app/(consumer)/home/page.tsx` |
| `/mypage` | `app/(consumer)/mypage/page.tsx` |
| `/rewards` | `app/(consumer)/rewards/page.tsx` |
| `/weather` | `app/(consumer)/weather/page.tsx` |
| `/pricing` | `app/(consumer)/pricing/page.tsx` |
| `/payment` | `app/(consumer)/payment/page.tsx` |
| `/payment/complete` | `app/(consumer)/payment/complete/page.tsx` |
| `/cancel-subscription` | `app/(consumer)/cancel-subscription/page.tsx` |
| `/admin/dashboard` | `app/(admin)/admin/dashboard/page.tsx` |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` |
| ... | ... |

`/` (랜딩)은 이미 `app/page.tsx`에 placeholder로 있음. 여진이 작업.

---

## 2. 자주 쓰는 패턴 5개

### ① 서버 컴포넌트에서 API 호출 (가장 단순)

```tsx
// app/(consumer)/mypage/page.tsx
import { headers } from 'next/headers'

async function fetchMyPage() {
  // 서버에서 자신의 API 호출 — 같은 도메인이라 직접 fetch
  const h = await headers()
  const cookie = h.get('cookie') ?? ''
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/auth/me`, {
    headers: { cookie },
    cache: 'no-store',
  })
  return res.json()
}

export default async function MyPage() {
  const data = await fetchMyPage()
  return <div>{data.data.name}</div>
}
```

⚠️ 서버 컴포넌트에서는 `lib/client.ts`의 `api.get()`이 안 됨 (브라우저 fetch 기반). 서버에선 위 패턴 사용.

### ② 클라이언트 컴포넌트에서 API 호출 (TanStack Query)

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client'

type Plan = { tier: string; name: string; price: number }

export function PricingList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/api/plans'),
  })

  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>오류가 발생했어요</div>

  return (
    <ul>
      {data?.map((p) => <li key={p.tier}>{p.name} — {p.price}원</li>)}
    </ul>
  )
}
```

### ③ POST/PATCH (Mutation + 토스트)

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client'

export function CancelButton() {
  const mutation = useMutation({
    mutationFn: () => api.patch('/api/subscriptions/cancel'),
    onSuccess: () => toast.success('구독을 해지했어요'),
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : '오류'
      toast.error(msg)
    },
  })

  return (
    <button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? '처리 중...' : '해지하기'}
    </button>
  )
}
```

### ④ 로그인 사용자 정보 확인 (클라이언트)

```tsx
'use client'
import { useMe } from '@/hooks/use-me'

export function Greeting() {
  const { data: me, isLoading } = useMe()
  if (isLoading) return null
  if (!me) return <p>로그인이 필요합니다</p>
  return <p>안녕하세요, {me.name}님</p>
}
```

### ⑤ 폼 처리 (HTML form + 서버 액션 또는 mutation)

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/client'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/login', { email, password })
      router.push('/home')
      router.refresh()
    } catch {
      toast.error('이메일 또는 비밀번호가 올바르지 않습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
```

---

## 3. 공통 컴포넌트는 자동 적용

`Header`, `Footer`는 `app/layout.tsx`에 이미 포함되어 있어 모든 페이지에 자동으로 나옴. 페이지 코드에서 직접 import할 필요 없음.

**페이지에는 본문(main content)만 작성하면 됨.**

---

## 4. 디자인 토큰 사용

`app/globals.css`에 정의된 토큰은 Tailwind 클래스로 그대로 사용 가능:

```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  결제하기
</button>

<div className="rounded-lg border bg-muted/30 p-4">
  <p className="text-sm text-muted-foreground">설명 문구</p>
</div>

<span className="text-success">✓ 활성</span>
<span className="text-destructive">⚠️ 위험</span>
<span className="bg-trigger-rain/10 text-trigger-rain">비</span>
```

**임의 색상 코드(예: `#2563EB`)는 직접 쓰지 말 것.** 토큰이 없으면 globals.css에 추가하고 사용.

---

## 5. 반응형 (B안 — 모바일 베이스 + 데스크탑 확장)

디자인은 모바일 기준으로 그리고, Tailwind 반응형 prefix로 데스크탑 확장.

```tsx
<div className="flex flex-col gap-4 md:flex-row md:gap-8">
  <Card>좌측 카드</Card>
  <Card>우측 카드</Card>
</div>
```

데스크탑 디자인의 구체 레이아웃이 애매하면, 작업 전 우석한테 한 번 보여주고 확인.

---

## 6. 페이지 작업 체크리스트

페이지 하나 끝낼 때마다 확인:

- [ ] 디자인(`docs/figma/...`)과 시각적으로 비슷한가
- [ ] 모바일/태블릿/데스크탑 모두 깨지지 않는가 (브라우저 크기 줄여보기)
- [ ] 로딩 상태 처리 (`isLoading`)
- [ ] 에러 상태 처리 (toast 또는 인라인 메시지)
- [ ] 빈 상태 처리 (보상 0건 같은 경우)
- [ ] 임의 색상 직접 입력하지 않고 토큰 사용
- [ ] `npm run lint` + `npm run build` 통과

---

## 7. PR 만들기

```bash
# 본인 작업 브랜치 (이름 패턴: feature/{본인영문이름}-{기능})
git checkout -b feature/yeojin-landing

# 작업 → 커밋
git add .
git commit -m "feat: 랜딩 페이지 구현"

# 푸시
git push -u origin feature/yeojin-landing
```

→ GitHub에서 PR 만들기. 한 PR에 한 페이지가 원칙.

---

## 8. 막히면

- 디자인 토큰·공통 컴포넌트가 부족하다 → 우석한테 알려주기 (`globals.css`나 `components/ui/`에 추가됨)
- Next.js 16 동작이 헷갈린다 → `node_modules/next/dist/docs/01-app/` 안에서 검색
- 디자인이 모호하다 → `docs/figma/` 다시 보거나 우석에게 질문
- API 응답 형식 모르겠다 → CLAUDE.md "API 응답 형식 통일" 섹션 + 백엔드 코드 (`app/api/.../route.ts`) 참고

화이팅 💪
