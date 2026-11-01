import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('badge', {
  variants: {
    variant: {
      neutral: 'badge-neutral',
      accent: 'badge-accent',
      warning: 'badge-warning',
      success: 'badge-success',
      error: 'badge-error',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
