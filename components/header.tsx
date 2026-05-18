// 공통 상단 네비게이션 (서버 컴포넌트)
// - 쿠키 기반 세션 조회로 로그인 상태 분기 (flicker 없음)
// - 로그아웃 버튼은 인터랙션 필요해서 별도 클라이언트 컴포넌트로 분리
// - TODO: "서울 21°C" 부분은 GET /api/weather/current 결과로 교체 (홈/날씨 페이지 작업 시 함께)

import Link from 'next/link'
import { Sun, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth-server'
import { LogoutButton } from '@/components/logout-button'

export async function Header() {
  const session = await getServerSession()
  const isLoggedIn = !!session
  const isAdmin = session?.role === 'admin'

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={isLoggedIn ? '/home' : '/'} className="flex items-center gap-2">
          {/* TODO: Parami 로고 SVG로 교체 (디자인의 구름 로고) */}
          <span className="text-xl font-bold text-primary">Parami</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
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
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary">
            상품
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-foreground hover:text-primary">
            요금제
          </Link>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Sun className="h-4 w-4 text-warning" />
            서울 21°C
          </span>
        </nav>

        <div className="flex items-center gap-2">
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
    </header>
  )
}
