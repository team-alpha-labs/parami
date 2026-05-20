'use client'

// 스크롤 진입 페이드인 + SSR race 회피.
//
// 배경:
//   1차 시도(whileInView + once:true): SSR/hydration 직후 IntersectionObserver 등록
//   타이밍 race로 callback 발화 못 하면 once:true 때문에 재시도 안 됨 → opacity:0 고정.
//   2차 시도(useInView 훅): 내부적으로 IO 사용해 같은 race에 영향받음 → 동일 증상 재현.
//
// 핵심 트릭: hydration 직후 key를 1번 토글해 motion.div를 강제 remount.
//   - 다른 페이지에서 client-side navigation으로 진입하면 fresh mount라 정상 동작 —
//     이걸 SSR 진입에서도 인위적으로 재현해서 IO를 fresh 부착 → race 회피.
//   - whileInView + viewport(once:true) 복구로 스크롤 진입 페이드인 효과 유지.
//
// 주의: key remount는 motion.div 자체와 그 자식을 unmount→remount함. 현재 사용처는
// 랜딩 섹션 wrapper(순수 표시 컴포넌트)라 안전하지만, FadeUp 안에 폼·결제·쿼리처럼
// 내부 state를 가진 컴포넌트를 감싸면 state 손실 위험. 범용 확장 전 재검토 필요.

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
    // 다음 프레임으로 setState 미룸:
    //   1) react-hooks/set-state-in-effect lint 규칙(effect 안 즉시 setState 금지) 회피
    //   2) hydration이 더 확실히 끝난 시점에 remount → race 회피 효과도 보강
    const id = requestAnimationFrame(() => setRemountKey(1))
    return () => cancelAnimationFrame(id)
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
