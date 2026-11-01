import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Plus, Shield, FlaskConical } from 'lucide-react'
import { PageHeading } from '@/components/shared/PageHeading'
import { PageTransition } from '@/components/shared/PageTransition'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/project-store'
import { ProjectCard, RecentRepairs, OverviewCard } from './DashboardParts'
import { WorkflowBlueprint } from '@/features/foundation/WorkflowBlueprint'

export function DashboardPage() {
  const { projects, sessions } = useProjectStore()
  return (
    <PageTransition className="page-container dashboard-page">
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title="A little clarity. A lot of possibility."
        description="Your projects, repairs, and the decisions that move them forward."
      >
        <Button asChild>
          <Link to="/app/repairs/new">
            <Plus size={15} />
            New repair
          </Link>
        </Button>
      </PageHeading>
      <section className="dashboard-stats" aria-label="Demonstration workspace statistics">
        <OverviewCard label="Projects" value={projects.length} detail="In your demo workspace" />
        <OverviewCard
          label="Repair sessions"
          value={sessions.length}
          detail="Every step, kept in view"
        />
        <OverviewCard
          label="Awaiting review"
          value={sessions.filter((session) => session.status === 'READY_FOR_REVIEW').length}
          detail="Your decision comes next"
        />
        <OverviewCard label="Live verified repairs" value={0} detail="Demo checks are simulated" />
      </section>
      <section className="welcome-hero dashboard-hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-star">✦</span>A SECOND CHANCE, BY DESIGN
          </div>
          <h2>
            From broken
            <br />
            <span>to back on track.</span>
          </h2>
          <p>
            Understand the issue. Inspect the repair.
            <br />
            Make the final call with confidence.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/app/repairs/new">
                Bring your website
                <ArrowUpRight size={15} />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/app/repairs/demo/diagnosis">
                Explore the sample
                <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </div>
        <WorkflowBlueprint />
      </section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ROOM TO MAKE THINGS BETTER</p>
            <h2>Recent projects</h2>
          </div>
          <Link className="text-link" to="/app/projects">
            All projects
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="project-grid">
          {projects.slice(0, 3).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              session={sessions.find((session) => session.projectId === project.id)}
            />
          ))}
        </div>
      </section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE WORK, IN PLAIN SIGHT</p>
            <h2>Recent repairs</h2>
          </div>
          <Link className="text-link" to="/app/repairs">
            View history
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <RecentRepairs sessions={sessions.slice(0, 4)} projects={projects} />
      </section>
      <div className="dashboard-trust">
        <Shield size={16} />
        <p>
          <strong>Your original project stays yours.</strong> This workspace runs on demonstration
          data. No changes are applied to source files.
        </p>
        <FlaskConical size={15} />
      </div>
    </PageTransition>
  )
}
