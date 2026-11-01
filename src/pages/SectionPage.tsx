import { Link } from 'react-router'
import { ArrowUpRight, FolderKanban, History, Upload } from 'lucide-react'
import { PageHeading } from '@/components/shared/PageHeading'
import { PageTransition } from '@/components/shared/PageTransition'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUiStore } from '@/store/ui-store'

const sections = {
  projects: {
    eyebrow: 'YOUR WORKSPACE',
    title: 'Projects',
    description: 'A home for every website you bring back to life.',
    icon: FolderKanban,
    emptyTitle: 'Something good starts here.',
    emptyDescription:
      'Project imports are coming soon. In the meantime, explore the workspace and get to know the repair journey.',
  },
  history: {
    eyebrow: 'YOUR WORKSPACE',
    title: 'Repair history',
    description: 'A clear record of the work and the decisions behind it.',
    icon: History,
    emptyTitle: 'A clean slate.',
    emptyDescription:
      'There are no repair sessions here. Explore the demo layout to see how a repair workspace fits together.',
  },
  import: {
    eyebrow: 'START A REPAIR',
    title: 'Bring your website to Phoenix.',
    description: 'Every repair begins with an isolated working copy.',
    icon: Upload,
    emptyTitle: 'A safe place to start.',
    emptyDescription:
      'Source import is coming next. No files can be uploaded in this preview. Take a look around the workspace while we get things ready.',
  },
}

export function SectionPage({ section }: { section: keyof typeof sections }) {
  const config = sections[section]
  const setGuideOpen = useUiStore((state) => state.setGuideOpen)
  return (
    <PageTransition className="page-container section-page">
      <PageHeading eyebrow={config.eyebrow} title={config.title} description={config.description}>
        <Badge>{section === 'import' ? 'Coming next' : 'Workspace preview'}</Badge>
      </PageHeading>
      <div className="section-empty-surface">
        <EmptyState
          icon={config.icon}
          eyebrow="A LITTLE POSSIBILITY"
          title={config.emptyTitle}
          description={config.emptyDescription}
        >
          <Button asChild>
            <Link to="/app/repairs/demo/diagnosis">
              Explore workspace
              <ArrowUpRight size={15} />
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setGuideOpen(true)}>
            How Phoenix works
          </Button>
        </EmptyState>
      </div>
      <div className="section-footnote">
        <span className="tiny-dot" />
        Local preview. No source files have been imported or changed.
      </div>
    </PageTransition>
  )
}
