import { Link } from 'react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Eye,
  GitPullRequestArrow,
  ShieldCheck,
  Upload,
  ScanLine,
  FileDiff,
  ListChecks,
} from 'lucide-react'
import { PageHeading } from '@/components/shared/PageHeading'
import { PageTransition } from '@/components/shared/PageTransition'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WorkflowBlueprint } from '@/features/foundation/WorkflowBlueprint'
import { useUiStore } from '@/store/ui-store'

const journey = [
  { label: 'Import', description: 'Bring your source', icon: Upload, to: '/app/repairs/new' },
  {
    label: 'Diagnose',
    description: 'Find the cause',
    icon: ScanLine,
    to: '/app/repairs/demo/diagnosis',
  },
  {
    label: 'Inspect',
    description: 'See every change',
    icon: FileDiff,
    to: '/app/repairs/demo/changes',
  },
  {
    label: 'Verify',
    description: 'Review the evidence',
    icon: ListChecks,
    to: '/app/repairs/demo/tests',
  },
  {
    label: 'Decide',
    description: 'Make the final call',
    icon: ShieldCheck,
    to: '/app/repairs/demo/review',
  },
]
const principles = [
  { icon: Box, title: 'Isolated by design', description: 'Repairs belong in a working copy.' },
  { icon: Eye, title: 'Visible at every step', description: 'Understand the why behind the what.' },
  {
    icon: GitPullRequestArrow,
    title: 'Always your decision',
    description: 'Your approval comes before application.',
  },
]

export function OverviewPage() {
  const setGuideOpen = useUiStore((state) => state.setGuideOpen)
  return (
    <PageTransition className="overview-page page-container">
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title="Good things are worth fixing."
        description="A fresh perspective on website repair. Welcome to Phoenix."
      >
        <Badge className="early-access-badge">
          <span className="tiny-dot" />
          Early access
        </Badge>
      </PageHeading>
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-star">✦</span>
            <span>LESS FRICTION. MORE FORWARD.</span>
          </div>
          <h2 id="welcome-title">
            From broken
            <br />
            <span>to back on track.</span>
          </h2>
          <p>
            A considered workspace to understand the issue,
            <br className="desktop-break" /> inspect the repair, and make the final call.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/app/repairs/demo/diagnosis">
                Explore workspace
                <ArrowUpRight size={16} />
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => setGuideOpen(true)}>
              How it works
              <ArrowRight size={14} />
            </Button>
          </div>
          <div className="hero-footnote">
            <ShieldCheck size={13} />
            Built around your control. From the very first file.
          </div>
        </div>
        <WorkflowBlueprint />
      </section>
      <section className="journey-section" aria-labelledby="journey-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE WAY FORWARD</p>
            <h2 id="journey-title">One clear path. No black box.</h2>
          </div>
          <button className="text-link" onClick={() => setGuideOpen(true)}>
            Meet the workflow
            <ArrowUpRight size={14} />
          </button>
        </div>
        <ol className="journey-steps">
          {journey.map(({ label, description, icon: Icon, to }, index) => (
            <li key={label}>
              <Link to={to} className="journey-step">
                <div className="journey-step-top">
                  <span className="journey-step-icon">
                    <Icon size={18} strokeWidth={1.6} />
                  </span>
                  <span className="mono journey-index">0{index + 1}</span>
                </div>
                <h3>
                  {label}
                  <ArrowUpRight size={13} />
                </h3>
                <p>{description}</p>
              </Link>
              {index < journey.length - 1 && <ArrowRight className="journey-connector" size={13} />}
            </li>
          ))}
        </ol>
      </section>
      <section className="principles" aria-label="Phoenix principles">
        {principles.map(({ icon: Icon, title, description }) => (
          <div className="principle" key={title}>
            <Icon size={18} strokeWidth={1.5} />
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </section>
      <div className="overview-bottom-note">
        <span className="mono">THOUGHTFUL REPAIRS. HUMAN DECISIONS.</span>
        <span>A little clarity goes a long way.</span>
      </div>
    </PageTransition>
  )
}
