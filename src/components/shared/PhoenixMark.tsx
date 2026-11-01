import { cn } from '@/lib/utils'

export function PhoenixMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="currentColor"
      aria-hidden="true"
      className={cn('phoenix-mark', className)}
    >
      <path d="M7 11l12 6-3 5-7-5z" />
      <path d="M33 11l-12 6 3 5 7-5z" />
      <path d="M12 23l8-8 8 8-8 9z" />
      <path d="M18 9l5 2-3 6-3-3z" />
    </svg>
  )
}
