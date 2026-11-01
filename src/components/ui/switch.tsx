import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn('switch', className)}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span />
    </button>
  )
}
