import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  ScanLine,
  FileCode2,
  AlertTriangle,
  Lightbulb,
  Play,
  LoaderCircle,
} from 'lucide-react'
import { useRepair } from '@/hooks/use-repair'
import { issues, repairPlan } from '@/services/mock/fixtures'
import { hasChanges, mockRepairService } from '@/services/mock/repairService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export function DiagnosisPage() {
  const { session } = useRepair()
  const [selected, setSelected] = useState(issues[0].id)
  const issue = issues.find((item) => item.id === selected)!
  const notify = useToast()
  const ready = hasChanges(session) || session.decision !== 'undecided'
  const running = ['ISOLATING', 'DIAGNOSING', 'PLANNING_REPAIR', 'REPAIRING'].includes(
    session.status,
  )
  return (
    <div className="feature-page diagnosis-page">
      <div className="feature-heading">
        <div>
          <p className="eyebrow">01 / DIAGNOSIS</p>
          <h2>Clarity before a single change.</h2>
          <p>Follow the investigation. Understand the proposed repair.</p>
        </div>
        <Badge variant="accent">Sample scenario</Badge>
      </div>
      {!ready ? (
        <div className="diagnosis-start">
          <span className="empty-state-icon">
            <ScanLine size={26} />
          </span>
          <h3>{running ? 'Following the trail…' : 'Let’s find the starting point.'}</h3>
          <p>
            {running
              ? 'The sample investigation is progressing in the activity panel. Every step here is simulated.'
              : 'Run a transparent demonstration of the Forma storefront failure. Your selected ZIP contents are not analyzed.'}
          </p>
          <Button
            disabled={running}
            onClick={() =>
              void mockRepairService
                .diagnose(session.id)
                .catch((error: Error) => notify(error.message))
            }
          >
            {running ? <LoaderCircle size={15} className="spin" /> : <Play size={14} />}
            {running ? 'Demo diagnosis running' : 'Run demo diagnosis'}
          </Button>
          {session.error && (
            <p role="alert" className="error-text">
              {session.error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="diagnosis-summary">
            <span className="summary-glyph">
              <ScanLine size={21} />
            </span>
            <div>
              <h3>One root cause. Two places to improve.</h3>
              <p>The sample homepage assumes product data is always ready.</p>
            </div>
            <Badge>2 findings · demo</Badge>
          </div>
          <div className="diagnosis-columns">
            <div>
              <div className="subsection-title">
                <h3>Detected issues</h3>
                <span className="mono">02</span>
              </div>
              <div className="issue-list">
                {issues.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item.id)}
                    aria-pressed={selected === item.id}
                    className={`issue-card ${selected === item.id ? 'issue-selected' : ''}`}
                  >
                    <div>
                      <Badge variant={item.severity === 'high' ? 'error' : 'warning'}>
                        <AlertTriangle size={11} />
                        {item.severity === 'high' ? 'High severity' : 'Medium severity'}
                      </Badge>
                      <span className="mono">DEMO</span>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <span className="issue-file mono">
                      <FileCode2 size={12} />
                      {item.file.split('/').pop()}
                    </span>
                  </button>
                ))}
              </div>
              <div className="repair-plan">
                <div className="subsection-title">
                  <h3>
                    <Lightbulb size={16} />
                    Proposed repair plan
                  </h3>
                  <Badge>Scoped</Badge>
                </div>
                <h4>{repairPlan.title}</h4>
                <ol>
                  {repairPlan.steps.map((step, index) => (
                    <li key={step}>
                      <span>0{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p>{repairPlan.scope}</p>
                <Button asChild>
                  <Link to={`/app/repairs/${session.id}/changes`}>
                    Inspect proposed changes
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </div>
            <aside className="issue-details">
              <p className="eyebrow">SELECTED ISSUE / DEMO</p>
              <h3>{issue.title}</h3>
              <dl>
                <div>
                  <dt>Affected file</dt>
                  <dd className="mono">{issue.file}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>Line {issue.id === 'runtime' ? 8 : issue.line} · sample source</dd>
                </div>
              </dl>
              <h4>What the evidence shows</h4>
              <pre>{issue.evidence}</pre>
              <h4>Why this happens</h4>
              <p>{issue.explanation}</p>
              <div className="explanation-label">
                <Lightbulb size={13} />
                Demonstration explanation
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
