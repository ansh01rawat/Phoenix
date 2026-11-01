import { Link } from 'react-router'
import { ArrowUpRight, Box, FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RepairStatus } from '@/components/shared/RepairStatus'
import { displaySessionId } from '@/services/mock/repairService'
import type { Project, RepairSession } from '@/types/repair'

export function ProjectCard({ project, session }: { project: Project; session?: RepairSession }) {
  return (
    <Link to={`/app/projects/${project.id}`} className="project-card">
      <div className="project-card-top">
        <span className="project-symbol" style={{ color: project.color }}>
          <Box size={23} strokeWidth={1.4} />
        </span>
        <ArrowUpRight size={15} />
      </div>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="project-card-bottom">
        <span>{project.framework}</span>
        <Badge>Demo</Badge>
      </div>
      {session && (
        <div className="project-last-status">
          <RepairStatus session={session} />
          <span>
            {new Date(session.createdAt).toLocaleDateString('en', {
              month: 'short',
              day: 'numeric',
              timeZone: 'Asia/Kolkata',
            })}
          </span>
        </div>
      )}
    </Link>
  )
}

export function RecentRepairs({
  sessions,
  projects,
}: {
  sessions: RepairSession[]
  projects: Project[]
}) {
  return (
    <div className="repair-table" role="list" aria-label="Repair sessions">
      {sessions.map((session) => (
        <Link
          role="listitem"
          className="repair-row"
          key={session.id}
          to={`/app/repairs/${session.id}/${session.status === 'IMPORTED' ? 'diagnosis' : session.status === 'REPAIR_READY' ? 'changes' : 'review'}`}
        >
          <span className="repair-row-icon">
            <FolderKanban size={17} />
          </span>
          <div className="repair-row-description">
            <span className="mono repair-reference">{displaySessionId(session.id)}</span>
            <h3>{session.title}</h3>
            <p>
              {projects.find((project) => project.id === session.projectId)?.name ??
                'Sample project'}
            </p>
          </div>
          <span className="repair-row-date">
            {new Date(session.createdAt).toLocaleDateString('en', {
              month: 'short',
              day: 'numeric',
              timeZone: 'Asia/Kolkata',
            })}
          </span>
          <RepairStatus session={session} />
          <ArrowUpRight size={14} className="muted" />
        </Link>
      ))}
    </div>
  )
}

export function OverviewCard({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="overview-stat">
      <span>{label}</span>
      <strong>{value.toString().padStart(2, '0')}</strong>
      <p>{detail}</p>
    </div>
  )
}
