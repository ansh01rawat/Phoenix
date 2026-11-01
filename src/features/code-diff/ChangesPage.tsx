import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, FileCode2, Folder, ChevronRight, Shield, Sparkles, Code2 } from 'lucide-react'
import { useRepair } from '@/hooks/use-repair'
import { modifiedFiles } from '@/services/mock/fixtures'
import { hasChanges } from '@/services/mock/repairService'
import { lineDiff } from '@/lib/diff'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ReadableDiff } from './ReadableDiff'
import { DiffBoundary } from './DiffBoundary'

const MonacoDiff = lazy(() => import('./MonacoDiff'))
export function ChangesPage() {
  const { session } = useRepair()
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = modifiedFiles.some((file) => file.path === searchParams.get('file'))
    ? searchParams.get('file')!
    : modifiedFiles[0].path
  const [desktop, setDesktop] = useState(
    () => window.matchMedia('(min-width: 900px) and (pointer: fine)').matches,
  )
  const [plain, setPlain] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px) and (pointer: fine)')
    const sync = () => setDesktop(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  const file = modifiedFiles.find((item) => item.path === selected)!
  const rows = lineDiff(file.original, file.modified)
  if (!hasChanges(session))
    return (
      <EmptyState
        icon={FileCode2}
        title={
          session.decision === 'rejected'
            ? 'This demo proposal was discarded.'
            : 'Start with a little investigation.'
        }
        description={
          session.decision === 'rejected'
            ? 'The simulated working copy is discarded. Original files were never changed.'
            : 'Run the demo diagnosis to prepare a meaningful sample repair.'
        }
      >
        <Button asChild>
          <Link to={`/app/repairs/${session.id}/diagnosis`}>
            Open diagnosis
            <ArrowRight size={14} />
          </Link>
        </Button>
      </EmptyState>
    )
  return (
    <div className="feature-page changes-page">
      <div className="feature-heading">
        <div>
          <p className="eyebrow">02 / CODE CHANGES</p>
          <h2>Every change, out in the open.</h2>
          <p>Two focused edits. A more resilient product collection.</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to={`/app/repairs/${session.id}/preview`}>
            Preview repair
            <ArrowRight size={13} />
          </Link>
        </Button>
      </div>
      <div className="changes-trust">
        <Shield size={14} />
        <span>Changes are isolated. Original project unchanged.</span>
        <Badge variant="accent">Demo source</Badge>
      </div>
      <div className="diff-workbench">
        <nav className="file-explorer" aria-label="Changed files">
          <div className="subsection-title">
            <h3>Changed files</h3>
            <Badge>2</Badge>
          </div>
          <div className="folder-label">
            <ChevronRight size={12} />
            <Folder size={13} />
            src
          </div>
          {modifiedFiles.map((item) => (
            <button
              key={item.path}
              className={selected === item.path ? 'file-active' : ''}
              aria-pressed={selected === item.path}
              onClick={() => setSearchParams({ file: item.path }, { replace: true })}
            >
              <FileCode2 size={14} />
              <span>
                <small>{item.path.includes('components') ? 'components /' : 'pages /'}</small>
                {item.path.split('/').pop()}
              </span>
              <span className="file-modified">M</span>
            </button>
          ))}
        </nav>
        <div className="diff-main">
          <div className="diff-file-header">
            <span className="mono">
              <FileCode2 size={13} />
              {file.path}
            </span>
            <span className="diff-counts">
              <span>+{rows.filter((row) => row.kind === 'added').length}</span>
              <span>−{rows.filter((row) => row.kind === 'removed').length}</span>
            </span>
          </div>
          <div className="diff-version-bar">
            <span>Original source</span>
            <span>Proposed repair · demo</span>
            <button onClick={() => setPlain(!plain)} aria-pressed={plain}>
              {plain ? 'Side by side' : 'Readable diff'}
            </button>
          </div>
          {desktop && !plain ? (
            <DiffBoundary
              fallback={
                <>
                  <p className="diff-recovery-note" role="status">
                    The interactive editor is unavailable. You can inspect every change in the
                    readable comparison below.
                  </p>
                  <ReadableDiff file={file} />
                </>
              }
            >
              <Suspense fallback={<ReadableDiff file={file} />}>
                <MonacoDiff file={file} />
              </Suspense>
            </DiffBoundary>
          ) : (
            <ReadableDiff file={file} />
          )}
        </div>
      </div>
      <section className="change-explanation">
        <span className="explanation-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <div className="subsection-title">
            <h3>Why this change matters</h3>
            <Badge>Demo explanation</Badge>
          </div>
          <h4>{file.summary}</h4>
          <p>{file.reason}</p>
          <span className="explanation-context">
            <Code2 size={12} />
            Addresses the sample homepage rendering failure.
          </span>
        </div>
      </section>
    </div>
  )
}
