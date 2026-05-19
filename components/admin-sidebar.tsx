'use client'

// 관리자 사이드바 — /admin/* 4개 페이지 공통
// 활성 메뉴 강조를 위해 클라이언트 컴포넌트 (usePathname)

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Zap, Gift, CreditCard, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const MENU = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '유저 목록', icon: Users },
  { href: '/admin/triggers', label: '트리거 내역', icon: Zap },
  { href: '/admin/rewards', label: '보상 내역', icon: Gift },
  { href: '/admin/payments', label: '결제 내역', icon: CreditCard },
  { href: '/admin/withdrawals', label: '출금 내역', icon: Wallet },
] as const

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="md:w-56 md:shrink-0">
      <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        관리자 메뉴
      </p>
      <nav className="mt-3 flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {MENU.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
