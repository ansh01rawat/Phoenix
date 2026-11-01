import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { FolderKanban, Plus, Search, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { PageHeading } from '@/components/shared/PageHeading'
import { PageTransition } from '@/components/shared/PageTransition'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/store/project-store'
import { mockRepairService } from '@/services/mock/repairService'
import { ProjectCard, RecentRepairs } from '@/features/dashboard/DashboardParts'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function ProjectsPage() {
  const { projects, sessions } = useProjectStore()
  const [query, setQuery] = useState('')
  const filtered = projects.filter((project) =>
    project.name.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <PageTransition className="page-container">
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title="Projects"
        description="A home for every website you bring back to life."
      >
        <Button asChild>
          <Link to="/app/repairs/new">
            <Plus size={15} />
            Import project
          </Link>
        </Button>
      </PageHeading>
      <div className="list-toolbar">
        <label className="search-field">
          <Search size={15} />
          <input
            aria-label="Search projects"
            placeholder="Find a project…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span className="muted">{filtered.length} projects · demo data</span>
      </div>
      {filtered.length ? (
        <div className="project-grid">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              session={sessions.find((session) => session.projectId === project.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="A little room for something new."
          description={
            query
              ? 'No projects match that search.'
              : 'Import a ZIP or start with the sample project.'
          }
        >
          <Button variant="secondary" onClick={() => setQuery('')}>
            Clear search
          </Button>
          <Button asChild>
            <Link to="/app/repairs/new">Import a project</Link>
          </Button>
        </EmptyState>
      )}
    </PageTransition>
  )
}
export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { projects, sessions } = useProjectStore()
  const navigate = useNavigate()
  const project = projects.find((item) => item.id === projectId)
  if (!project) return <NotFoundPage />
  const projectSessions = sessions.filter((session) => session.projectId === projectId)
  return (
    <PageTransition className="page-container">
      <Link to="/app/projects" className="text-link">
        <ArrowLeft size={13} />
        All projects
      </Link>
      <div className="project-detail-heading">
        <PageHeading
          eyebrow="PROJECT / DEMO"
          title={project.name}
          description={project.description ?? 'A local demonstration project.'}
        >
          <Button
            onClick={async () => {
              const session = await mockRepairService.create(project.id)
              navigate(`/app/repairs/${session.id}/diagnosis`)
            }}
          >
            New demo repair
            <ArrowUpRight size={15} />
          </Button>
        </PageHeading>
      </div>
      <div className="project-info">
        <div>
          <span className="eyebrow">Framework</span>
          <p>{project.framework}</p>
        </div>
        <div>
          <span className="eyebrow">Source reference</span>
          <p className="mono">{project.sourceName}</p>
        </div>
        <div>
          <span className="eyebrow">Applied changes</span>
          <p>None · original source untouched</p>
        </div>
        <Badge variant="accent">Demo project</Badge>
      </div>
      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Repair sessions</h2>
          <span className="muted">{projectSessions.length} sessions</span>
        </div>
        <RecentRepairs sessions={projectSessions} projects={projects} />
      </section>
    </PageTransition>
  )
}
export function RepairHistoryPage() {
  const { sessions, projects } = useProjectStore()
  const [filter, setFilter] = useState('All')
  const filtered = sessions.filter(
    (session) =>
      filter === 'All' ||
      (filter === 'Awaiting review'
        ? session.status === 'READY_FOR_REVIEW'
        : session.decision === filter.toLowerCase()),
  )
  return (
    <PageTransition className="page-container">
      <PageHeading
        eyebrow="THE WORK, IN PLAIN SIGHT"
        title="Repair history"
        description="Every proposal, every decision. A clear record of your demo sessions."
      />
      <div className="filter-bar" aria-label="Filter repairs">
        {['All', 'Awaiting review', 'Approved', 'Rejected'].map((item) => (
          <button
            key={item}
            className={filter === item ? 'filter-active' : ''}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
            <span>
              {item === 'All'
                ? sessions.length
                : sessions.filter((session) =>
                    item === 'Awaiting review'
                      ? session.status === 'READY_FOR_REVIEW'
                      : session.decision === item.toLowerCase(),
                  ).length}
            </span>
          </button>
        ))}
      </div>
      {filtered.length ? (
        <RecentRepairs sessions={filtered} projects={projects} />
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Nothing here just yet."
          description="Sessions will appear here when they match this decision state."
        >
          <Button variant="secondary" onClick={() => setFilter('All')}>
            Show all repairs
          </Button>
        </EmptyState>
      )}
    </PageTransition>
  )
}
