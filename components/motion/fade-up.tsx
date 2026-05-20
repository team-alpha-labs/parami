'use client'

// 마운트 시 한 번 페이드인. (이전: whileInView/useInView 기반 스크롤 진입 트리거 사용했으나
// SSR/hydration 직후 IntersectionObserver 등록 타이밍 race로 옵저버 callback이 발화 안 해
// 섹션이 opacity:0으로 영구 고정되는 이슈가 직접 진입 케이스에서 재현됨 — IO callback 자체를 제거.)
//
// 트레이드오프: 스크롤 진입 트리거 손실 → fold 아래 섹션도 페이지 로드 시 함께 페이드인.
// 사용자가 스크롤해서 도달했을 땐 이미 final 상태라 시각적 문제 없음.

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FadeUpProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
