import { Badge } from '@/components/ui/badge'
import { CircleDashed, FlaskConical, Ban, Clock3, LoaderCircle } from 'lucide-react'
import type { RepairSession } from '@/types/repair'
export function RepairStatus({ session }: { session: RepairSession }) {
  const running = [
    'ISOLATING',
    'DIAGNOSING',
    'PLANNING_REPAIR',
    'REPAIRING',
    'VERIFYING',
    'APPROVAL_PENDING',
  ].includes(session.status)
  const Icon = running
    ? LoaderCircle
    : session.decision === 'rejected'
      ? Ban
      : session.status === 'READY_FOR_REVIEW'
        ? Clock3
        : session.verification === 'simulated'
          ? FlaskConical
          : CircleDashed
  const label =
    session.status === 'APPROVAL_PENDING'
      ? 'Recording demo decision'
      : running
        ? 'Demo running'
        : session.status === 'READY_FOR_REVIEW'
          ? 'Ready for review'
          : session.status === 'REPAIR_READY'
            ? 'Changes proposed'
            : session.status === 'APPROVED'
              ? 'Demo approved'
              : session.status === 'REJECTED'
                ? 'Demo rejected'
                : session.status === 'FAILED'
                  ? 'Needs attention'
                  : 'Ready to diagnose'
  return (
    <Badge
      variant={
        session.status === 'FAILED'
          ? 'warning'
          : session.status === 'READY_FOR_REVIEW'
            ? 'warning'
            : 'neutral'
      }
    >
      <Icon size={12} className={running ? 'spin' : ''} />
      {label}
    </Badge>
  )
}
