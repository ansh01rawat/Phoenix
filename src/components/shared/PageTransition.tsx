import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useUiStore } from '@/store/ui-store'

export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const systemReducedMotion = useReducedMotion()
  const reduceMotion = useUiStore((state) => state.reduceMotion)
  return (
    <motion.div
      className={className}
      initial={systemReducedMotion || reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
