import { Link, useLocation } from 'react-router'
import { ArrowRight, ArrowLeft, CircleDashed } from 'lucide-react'
import { repairStages } from '@/config/navigation'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageTransition } from '@/components/shared/PageTransition'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/ui-store'

export function WorkspaceStagePage() {
  const { pathname } = useLocation()
  const index = repairStages.findIndex((stage) => pathname.endsWith(`/${stage.id}`))
  const stage = repairStages[index < 0 ? 0 : index]
  const next = repairStages[index + 1]
  const setGuideOpen = useUiStore((state) => state.setGuideOpen)
  return (
    <PageTransition key={stage.id} className="stage-page">
      <div className="canvas-topline">
        <span className="eyebrow">{stage.label}</span>
        <span className="canvas-id mono">PX-DEMO / {stage.number}</span>
      </div>
      <EmptyState
        icon={stage.icon}
        eyebrow={`STEP ${stage.number} OF 05`}
        title={stage.title}
        description={stage.description}
      >
        <Button variant="secondary" asChild>
          <Link to={next ? `/app/repairs/demo/${next.id}` : '/app'}>
            {next ? (
              <>
                Next: {next.label}
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <ArrowLeft size={14} />
                Back to overview
              </>
            )}
          </Link>
        </Button>
        <Button variant="ghost" onClick={() => setGuideOpen(true)}>
          How it works
        </Button>
      </EmptyState>
      <div className="canvas-waiting">
        <CircleDashed size={15} />
        <div>
          <span>{stage.emptyLabel}</span>
          <p>This layout is ready for a future repair session.</p>
        </div>
        <span className="canvas-waiting-label mono">NOT STARTED</span>
      </div>
    </PageTransition>
  )
}
