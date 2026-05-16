// Next.js 16: 기존 middleware → proxy로 이름 변경 (동작 동일)
// 라우트 가드:
//   - 비로그인 사용자가 보호 라우트(/home, /mypage 등) 접근 → /login 리다이렉트
//   - 이미 로그인된 사용자가 /login, /signup 접근 → /home 리다이렉트
//   - /admin/* 접근 시 토큰 필수 (role='admin' 체크는 페이지/API에서)
//
// JWT 검증은 jsonwebtoken이 Edge 런타임에서 안 돌아가서 토큰 존재 여부만 optimistic 체크.
// 실제 role 검증은 페이지 서버 컴포넌트 또는 API 라우트에서 수행.

import { NextResponse, type NextRequest } from 'next/server'

// 공개 라우트 — 비로그인도 접근 가능
// 운영 약관·정책 페이지는 법적으로 누구나 볼 수 있어야 함 (페이지 자체는 추후 제작)
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/support',
])
const ADMIN_PREFIX = '/admin'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasToken = !!req.cookies.get('token')?.value

  // 이미 로그인한 사용자가 /login, /signup 접근 → /home으로 보냄
  if (hasToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // 공개 라우트는 그대로 통과 (랜딩/로그인/회원가입/요금제)
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  // 관리자 영역: 토큰 필수. role='admin' 체크는 페이지에서 (lib/auth-server.ts)
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!hasToken) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 그 외 모든 라우트는 보호 (/home, /mypage, /rewards, /weather, /payment*, /cancel-subscription 등)
  if (!hasToken) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
