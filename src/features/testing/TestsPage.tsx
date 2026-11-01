import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Play,
  FlaskConical,
  CircleCheck,
  CircleX,
  Minus,
  ChevronDown,
  LoaderCircle,
} from 'lucide-react'
import { useRepair } from '@/hooks/use-repair'
import { hasChanges, mockRepairService } from '@/services/mock/repairService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { summarizeDemoVerification } from '@/services/mock/verification'

export function TestsPage() {
  const { session } = useRepair()
  const [filter, setFilter] = useState('All')
  const [scenario, setScenario] = useState<'passed' | 'failed'>('passed')
  const notify = useToast()
  const running = session.status === 'VERIFYING'
  const report = summarizeDemoVerification(session.tests)
  const { passed, failed, skipped } = report
  const recordingDecision = session.status === 'APPROVAL_PENDING'
  if (!hasChanges(session) && !session.tests.length)
    return (
      <EmptyState
        icon={FlaskConical}
        title="A repair needs something to verify."
        description="Prepare the demonstration proposal before running its simulated checks."
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
    <div className="feature-page testing-page">
      <div className="feature-heading">
        <div>
          <p className="eyebrow">04 / VERIFICATION</p>
          <h2>Confidence needs evidence.</h2>
          <p>Read every check. Know exactly what the report means.</p>
        </div>
        <Badge variant="accent">
          <FlaskConical size={12} />
          Simulated results
        </Badge>
      </div>
      <div className="test-demo-banner">
        <FlaskConical size={18} />
        <div>
          <h3>These checks are a demonstration.</h3>
          <p>
            No build or browser test is run against your archive. Real verification requires the
            future sandbox backend.
          </p>
        </div>
      </div>
      {session.error && (
        <div className="inline-error" role="alert">
          {session.error}
        </div>
      )}
      {session.decision !== 'undecided' && (
        <p className="recorded-report-note">
          Recorded demonstration report ·{' '}
          {session.decision === 'rejected'
            ? 'working copy discarded'
            : 'approval recorded, no files applied'}
        </p>
      )}
      <div className="test-summary" role="group" aria-label="Simulated verification summary">
        <div>
          <strong>{session.tests.length.toString().padStart(2, '0')}</strong>
          <span>Total checks</span>
        </div>
        <div>
          <strong>{passed.toString().padStart(2, '0')}</strong>
          <span>Demo passed</span>
        </div>
        <div>
          <strong className={failed ? 'error-text' : ''}>
            {failed.toString().padStart(2, '0')}
          </strong>
          <span>Demo failed</span>
        </div>
        <div>
          <strong>{skipped.toString().padStart(2, '0')}</strong>
          <span>Skipped</span>
        </div>
      </div>
      {session.decision === 'undecided' && (
        <div className="test-actions">
          <label>
            Demo scenario
            <select
              aria-label="Demo verification scenario"
              value={scenario}
              onChange={(event) => setScenario(event.target.value as 'passed' | 'failed')}
              disabled={running || recordingDecision}
            >
              <option value="passed">Passing checks</option>
              <option value="failed">Runtime failure</option>
            </select>
          </label>
          <Button
            disabled={running || recordingDecision}
            onClick={() => {
              setFilter('All')
              void mockRepairService
                .verify(session.id, scenario)
                .catch((error: Error) => notify(error.message))
            }}
          >
            {running ? <LoaderCircle size={14} className="spin" /> : <Play size={13} />}
            {running
              ? 'Simulating checks…'
              : session.tests.length
                ? 'Run demo checks again'
                : 'Run demo checks'}
          </Button>
        </div>
      )}
      <div className="filter-bar" role="group" aria-label="Filter test results">
        {['All', 'Passed', 'Failed', 'Skipped'].map((item) => (
          <button
            key={item}
            aria-pressed={filter === item}
            className={filter === item ? 'filter-active' : ''}
            onClick={() => setFilter(item)}
          >
            {item}
            <span aria-hidden="true">
              {item === 'All'
                ? report.total
                : item === 'Passed'
                  ? passed
                  : item === 'Failed'
                    ? failed
                    : skipped}
            </span>
          </button>
        ))}
      </div>
      <div className="test-list">
        {session.tests
          .filter((test) => filter === 'All' || test.status === filter.toLowerCase())
          .map((test) => (
            <details className="test-result" key={test.id}>
              <summary>
                <span className={`test-status-icon test-${test.status}`}>
                  {test.status === 'passed' ? (
                    <CircleCheck size={16} />
                  ) : test.status === 'failed' ? (
                    <CircleX size={16} />
                  ) : (
                    <Minus size={16} />
                  )}
                </span>
                <span className="test-name">
                  {test.name}
                  <small>{test.description}</small>
                </span>
                <span className="test-result-label">
                  {test.status === 'skipped' ? 'Skipped' : `Demo ${test.status}`}
                </span>
                <span className="test-duration mono">
                  {test.duration ? `${test.duration} ms` : '—'}
                </span>
                <ChevronDown size={14} />
              </summary>
              <pre>{test.log}</pre>
            </details>
          ))}
        {!session.tests.length && (
          <div className="test-empty" role="status">
            {running
              ? 'Running the simulated verification sequence…'
              : 'No checks have run. Choose a scenario to create a clearly labeled demonstration report.'}
          </div>
        )}
        {session.tests.length > 0 &&
          !session.tests.some(
            (test) => filter === 'All' || test.status === filter.toLowerCase(),
          ) && <div className="test-empty">No {filter.toLowerCase()} checks in this report.</div>}
      </div>
      {session.tests.length > 0 && (
        <div className={`verification-outcome ${!report.complete ? 'verification-failed' : ''}`}>
          <div>
            <h3>
              {!report.complete
                ? 'A sample check needs attention.'
                : 'Demonstration checks completed.'}
            </h3>
            <p>
              {!report.complete
                ? `${report.blockingReason} Select Passing checks and rerun to continue the demo.`
                : `${passed} simulated checks passed; ${skipped} optional ${skipped === 1 ? 'check was' : 'checks were'} skipped. All ${report.requiredTotal} required demo checks passed. This is not real verification.`}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to={`/app/repairs/${session.id}/review`}>
              Review repair
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
