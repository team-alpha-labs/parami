// 공통 상단 네비게이션 (서버 컴포넌트)
// - 쿠키 기반 세션 조회로 로그인 상태 분기 (flicker 없음)
// - 로그아웃 버튼은 인터랙션 필요해서 별도 클라이언트 컴포넌트로 분리
// - 날씨 위젯은 framer-motion 애니메이션이 필요해 components/header-weather.tsx로 분리
// - 레이아웃: 좌측 (로고+워드마크) | 우측 (메뉴 + 날씨 + 로그인/CTA) — justify-between

import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth-server'
import { LogoutButton } from '@/components/logout-button'
import { HeaderWeather } from '@/components/header-weather'

export async function Header() {
  const session = await getServerSession()
  const isLoggedIn = !!session
  const isAdmin = session?.role === 'admin'

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={isLoggedIn ? '/home' : '/'} className="flex items-center gap-2">
          <Image
            src="/images/logo-duck.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            priority
          />
          <span className="text-xl font-bold text-primary">Parami</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* native <a href="/#explore"> — Next.js <Link>의 hash navigation 불안정 우회 패턴 */}
          <nav className="hidden items-center gap-4 md:flex">
            {isLoggedIn && (
              <Link href="/home" className="text-sm font-medium text-foreground hover:text-primary">
                홈
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/dashboard" className="text-sm font-medium text-destructive hover:text-destructive/80">
                관리자
              </Link>
            )}
            <a href="/#explore" className="text-sm font-medium text-foreground hover:text-primary">
              상품
            </a>
            <Link href="/pricing" className="text-sm font-medium text-foreground hover:text-primary">
              요금제
            </Link>
            <HeaderWeather />
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/mypage" aria-label="마이페이지">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">시작하기</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
