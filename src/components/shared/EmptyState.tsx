import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon
  eyebrow?: string
  title: string
  description: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state-icon">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      <p className="empty-state-description">{description}</p>
      {children && <div className="empty-state-actions">{children}</div>}
    </div>
  )
}
