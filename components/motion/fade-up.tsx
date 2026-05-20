'use client'

// 스크롤 진입 페이드인 + SSR race 회피.
//
// 핵심 트릭: 마운트 직후 key를 바꿔 motion.div를 한 번 강제 remount.
//   - SSR으로 들어온 motion.div는 IntersectionObserver 등록 타이밍 race로
//     callback이 발화 안 하는 경우가 있음 → 섹션이 opacity:0으로 stuck.
//   - 다른 페이지에서 client-side navigation으로 진입하면 fresh mount라 정상 동작 —
//     이걸 모방해서 hydration 직후 useEffect로 key를 1번 토글하면 motion.div가
//     unmount → remount 되며 IO도 fresh 등록 → race 회피.
//   - 결과: 스크롤 진입 시 페이드인 효과는 유지 + 첫 진입 stuck 버그도 해결.

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'

interface FadeUpProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const reduce = useReducedMotion()
  const [remountKey, setRemountKey] = useState(0)

  useEffect(() => {
    // hydration 직후 motion.div를 강제 remount → IO fresh 부착
    setRemountKey(1)
  }, [])

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      key={remountKey}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
