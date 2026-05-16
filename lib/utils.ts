import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn — Tailwind 클래스 조합 헬퍼 (shadcn/ui 표준 패턴)
// 조건부 클래스 + 충돌 클래스 자동 머지
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
