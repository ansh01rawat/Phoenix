import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router'
import {
  ArrowLeft,
  Box,
  Copy,
  FileArchive,
  FlaskConical,
  Shield,
  ChevronDown,
  Check,
  CircleDashed,
} from 'lucide-react'
import { repairStages } from '@/config/navigation'
import { activityLabels } from '@/services/mock/fixtures'
import { displaySessionId } from '@/services/mock/repairService'
import { useProjectStore } from '@/store/project-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RepairStatus } from '@/components/shared/RepairStatus'
import { useToast } from '@/hooks/use-toast'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { cn } from '@/lib/utils'

export function RepairWorkspaceLayout() {
  const { repairId } = useParams()
  const { pathname } = useLocation()
  const { sessions, projects } = useProjectStore()
  const session = sessions.find((item) => item.id === repairId)
  const project = projects.find((item) => item.id === session?.projectId)
  const announce = useToast()
  const workflowRef = useRef<HTMLElement>(null)
  const currentStage =
    repairStages.find((stage) => pathname.endsWith(`/${stage.id}`)) ?? repairStages[0]
  useEffect(() => {
    const navigation = workflowRef.current
    if (!navigation) return
    const revealCurrentStage = () => {
      const active = navigation.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active) return
      const strip = navigation.getBoundingClientRect()
      const tab = active.getBoundingClientRect()
      const inset = 8
      const adjustment =
        tab.right > strip.right - inset
          ? tab.right - strip.right + inset
          : tab.left < strip.left + inset
            ? tab.left - strip.left - inset
            : 0
      // Move only the tab strip: revealing a stage must not scroll the page.
      if (adjustment) navigation.scrollLeft += adjustment
    }
    revealCurrentStage()
    const observer = new ResizeObserver(revealCurrentStage)
    observer.observe(navigation)
    return () => observer.disconnect()
  }, [pathname])
  if (!session || !project) return <NotFoundPage />
  const running = ['ISOLATING', 'DIAGNOSING', 'PLANNING_REPAIR', 'REPAIRING'].includes(
    session.status,
  )
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(displaySessionId(session.id))
      announce('Session identifier copied')
    } catch {
      announce('Clipboard unavailable. The session identifier is shown above.')
    }
  }
  return (
    <div className="workspace-page live-workspace">
      <div className="workspace-topline">
        <Link className="text-link back-link" to="/app">
          <ArrowLeft size={13} />
          Back to overview
        </Link>
        <span className="mono workspace-session-id">{displaySessionId(session.id)}</span>
      </div>
      <div className="workspace-heading">
        <div>
          <div className="title-with-badge">
            <h1>Repair workspace</h1>
            <Badge variant="accent">Demo session</Badge>
          </div>
          <p>
            {project.name}
            <span className="workspace-title-separator">/</span>
            {session.title}
          </p>
        </div>
        <div className="workspace-heading-actions">
          <RepairStatus session={session} />
          <Button
            variant="secondary"
            size="icon"
            aria-label="Copy session identifier"
            onClick={() => void copyId()}
          >
            <Copy size={14} />
          </Button>
        </div>
      </div>
      <div className="workspace-surface">
        <nav ref={workflowRef} className="workflow-navigation" aria-label="Repair workflow">
          {repairStages.map(({ id, label, number, icon: Icon }) => (
            <NavLink
              key={id}
              to={`/app/repairs/${session.id}/${id}`}
              className={({ isActive }) => cn('workflow-tab', isActive && 'workflow-tab-active')}
            >
              <span className="workflow-number">{number}</span>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
          <span className="workflow-environment">
            <Box size={12} />
            Isolated demo
          </span>
        </nav>
        <div className="workspace-demo-notice">
          <FlaskConical size={15} />
          <p>
            <strong>Demonstration mode.</strong> Diagnosis, changes, previews, and checks use the
            Forma sample fixture. No original files are changed.
          </p>
        </div>
        <details className="compact-context">
          <summary>
            Session and activity details
            <ChevronDown size={13} />
          </summary>
          <div className="compact-context-body">
            <dl>
              <div>
                <dt>Session</dt>
                <dd className="mono">{displaySessionId(session.id)}</dd>
              </div>
              <div>
                <dt>Working copy</dt>
                <dd>{session.sandbox === 'discarded' ? 'Demo discarded' : 'Simulated'}</dd>
              </div>
              <div>
                <dt>Source reference</dt>
                <dd>{session.sourceName}</dd>
              </div>
            </dl>
            <div>
              <p className="eyebrow">{currentStage.label} · In this step</p>
              <ul>
                {currentStage.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
        <div className="workspace-grid">
          <aside className="session-panel" aria-label="Session details">
            <div className="session-panel-title">
              <span className="eyebrow">SESSION / DEMO</span>
              <FlaskConical size={13} className="muted" />
            </div>
            <h2>{project.name}</h2>
            <p className="session-id mono">{displaySessionId(session.id)}</p>
            <div className="session-metadata">
              <div>
                <Box size={15} />
                <span>
                  Working copy
                  <small>
                    {session.sandbox === 'discarded' ? 'Demo discarded' : 'Simulated · local only'}
                  </small>
                </span>
              </div>
              <div>
                <FileArchive size={15} />
                <span>
                  Source reference<small className="source-reference">{session.sourceName}</small>
                </span>
              </div>
            </div>
            <div className="session-activity">
              <p className="eyebrow">SIMULATED ACTIVITY</p>
              <ol className="activity-timeline">
                {activityLabels.map((label, index) => {
                  const done = session.activityStep > index || (index === 0 && !running)
                  const active = running && session.activityStep === index
                  return (
                    <li
                      key={label}
                      className={active ? 'activity-running' : done ? 'activity-complete' : ''}
                    >
                      <span>
                        {done ? (
                          <Check size={10} />
                        ) : active ? (
                          <span className="activity-running-dot" />
                        ) : (
                          <CircleDashed size={10} />
                        )}
                      </span>
                      <div>
                        {label}
                        <small>{done ? 'Demo complete' : active ? 'Simulating…' : 'Waiting'}</small>
                      </div>
                    </li>
                  )
                })}
                <li
                  className={
                    session.tests.length
                      ? 'activity-complete'
                      : session.status === 'VERIFYING'
                        ? 'activity-running'
                        : ''
                  }
                >
                  <span>
                    {session.tests.length ? <Check size={10} /> : <CircleDashed size={10} />}
                  </span>
                  <div>
                    Verification
                    <small>
                      {session.tests.length
                        ? 'Simulated report'
                        : session.status === 'VERIFYING'
                          ? 'Simulating…'
                          : 'Not run'}
                    </small>
                  </div>
                </li>
              </ol>
            </div>
            <div className="session-protection">
              <Shield size={17} />
              <p>
                Original files unchanged.
                <br />
                <span>Application requires a real backend.</span>
              </p>
            </div>
          </aside>
          <div className="workspace-canvas">
            <Outlet context={{ session, project }} />
          </div>
        </div>
        <div className="workspace-bottomline">
          <span>
            <span className="tiny-dot" />
            {session.decision === 'rejected'
              ? 'Demo working copy discarded'
              : session.decision === 'approved'
                ? 'Demo approval recorded · no files applied'
                : 'Proposed changes remain isolated'}
          </span>
          <span className="mono">DEMO · ORIGINAL UNCHANGED</span>
        </div>
      </div>
    </div>
  )
}
