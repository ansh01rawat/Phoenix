import { FlaskConical, CircleDashed, CircleCheck, CircleAlert, Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type StatusKind = 'demo' | 'idle' | 'pending' | 'verified' | 'failed'
const statusConfig = {
  demo: { icon: FlaskConical, label: 'Demo mode', variant: 'accent' },
  idle: { icon: CircleDashed, label: 'Not started', variant: 'neutral' },
  pending: { icon: Clock3, label: 'Awaiting review', variant: 'warning' },
  verified: { icon: CircleCheck, label: 'Verified', variant: 'success' },
  failed: { icon: CircleAlert, label: 'Failed', variant: 'error' },
} as const

/** Verified is reserved for actual backend verification, never mock results. */
export function StatusBadge({ status, label }: { status: StatusKind; label?: string }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Badge variant={config.variant}>
      <Icon size={12} />
      {label ?? config.label}
    </Badge>
  )
}
