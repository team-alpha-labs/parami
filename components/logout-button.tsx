'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/client'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
      router.push('/')
      router.refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '로그아웃 실패'
      toast.error(msg)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
      <LogOut className="h-5 w-5" />
    </Button>
  )
}
