'use client'

// whileInView 대신 useInView 훅으로 명시 제어.
// 기존 whileInView + once:true 조합은 SSR/hydration 직후 IntersectionObserver 등록 타이밍 race로
// 트리거를 놓치면 once:true라 다시 발화 안 함 → 섹션이 opacity:0으로 영구 고정되는 이슈 발생
// (시크릿 모드 신규 진입 시 §2~ 모든 섹션이 안 보였던 원인).
// useInView는 마운트 시점에 현재 viewport 상태를 동기적으로 평가하므로 race 안 남.

import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface FadeUpProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
