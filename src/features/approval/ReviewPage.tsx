import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Shield,
  ArrowRight,
  FileCode2,
  FlaskConical,
  Check,
  X,
  LockKeyhole,
  ChevronDown,
} from 'lucide-react'
import { useRepair } from '@/hooks/use-repair'
import { modifiedFiles } from '@/services/mock/fixtures'
import { canApprove, hasChanges, mockRepairService } from '@/services/mock/repairService'
import { lineDiff } from '@/lib/diff'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { summarizeDemoVerification } from '@/services/mock/verification'

export function ReviewPage() {
  const { session, project } = useRepair()
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null)
  const [busy, setBusy] = useState(false)
  const notify = useToast()
  const navigate = useNavigate()
  const approved = session.decision === 'approved',
    rejected = session.decision === 'rejected'
  const report = summarizeDemoVerification(session.tests)
  const { passed, failed, skipped } = report
  const verificationComplete = session.verification === 'simulated' && report.complete
  const recordingDecision = busy || session.status === 'APPROVAL_PENDING'
  const decide = async () => {
    if (!dialog || busy) return
    setBusy(true)
    try {
      await mockRepairService.decide(session.id, dialog === 'approve' ? 'approved' : 'rejected')
      setDialog(null)
      notify(
        dialog === 'approve'
          ? 'Demo approval recorded. No source files were applied.'
          : 'Demo rejection recorded. Simulated working copy discarded.',
      )
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not record the decision. Try again.')
    } finally {
      setBusy(false)
    }
  }
  if (!hasChanges(session) && !rejected)
    return (
      <EmptyState
        icon={Shield}
        title="A considered decision starts with a proposal."
        description="Run the sample diagnosis, inspect its changes, and review the checks first."
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
    <div className="feature-page review-page">
      <div className="review-intro">
        <span className="review-glyph">
          <Shield size={27} strokeWidth={1.4} />
        </span>
        <p className="eyebrow">05 / YOUR DECISION</p>
        <h2>
          {approved
            ? 'Your demo approval is recorded.'
            : rejected
              ? 'This demo repair was rejected.'
              : !session.tests.length
                ? 'Verify the proposal before deciding.'
                : !verificationComplete
                  ? 'A check needs your attention.'
                  : 'Your repair is ready for review.'}
        </h2>
        <p>
          {approved
            ? 'A decision is not an application. Your original files have not changed.'
            : rejected
              ? 'The simulated working copy is discarded. Your original project remains untouched.'
              : 'The issue, the changes, and the evidence. Take a moment to see the whole picture.'}
        </p>
        <Badge variant="accent">
          <FlaskConical size={11} />
          Demonstration repair
        </Badge>
      </div>
      <section className="review-summary">
        <div>
          <span className="eyebrow">THE ISSUE</span>
          <h3>Product data was not ready.</h3>
          <p>An undefined collection interrupted the sample homepage render.</p>
        </div>
        <div>
          <span className="eyebrow">THE PROPOSAL</span>
          <h3>Handle the data lifecycle.</h3>
          <p>Guard the collection and communicate loading, empty, and error states.</p>
        </div>
      </section>
      <div className="review-metrics">
        <div>
          <strong>{modifiedFiles.length.toString().padStart(2, '0')}</strong>
          <span>Source files</span>
        </div>
        <div>
          <strong>{passed.toString().padStart(2, '0')}</strong>
          <span>Demo checks passed</span>
        </div>
        <div>
          <strong>{failed.toString().padStart(2, '0')}</strong>
          <span>Demo failures</span>
        </div>
        <div>
          <strong>00</strong>
          <span>Files applied</span>
        </div>
      </div>
      <section className="review-files">
        <div className="subsection-title">
          <h3>Small changes. A clear purpose.</h3>
          {!rejected && (
            <Link className="text-link" to={`/app/repairs/${session.id}/changes`}>
              Inspect diff
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
        {modifiedFiles.map((file) => {
          const rows = lineDiff(file.original, file.modified)
          return (
            <div className="review-file" key={file.path}>
              <FileCode2 size={17} />
              <div>
                <h4 className="mono">
                  {!rejected ? (
                    <Link
                      to={`/app/repairs/${session.id}/changes?file=${encodeURIComponent(file.path)}`}
                      aria-label={`Inspect ${file.path.split('/').pop()} diff`}
                    >
                      {file.path}
                      <ArrowRight size={11} />
                    </Link>
                  ) : (
                    file.path
                  )}
                </h4>
                <p>{file.summary}</p>
                <details className="review-file-explanation">
                  <summary>
                    Why this change
                    <ChevronDown size={11} />
                  </summary>
                  <p>{file.reason}</p>
                </details>
              </div>
              <span className="diff-counts">
                <span>+{rows.filter((row) => row.kind === 'added').length}</span>
                <span>−{rows.filter((row) => row.kind === 'removed').length}</span>
              </span>
            </div>
          )
        })}
      </section>
      <div className="review-verification">
        <FlaskConical size={18} />
        <div>
          <h3>
            {!verificationComplete && session.tests.length
              ? 'Verification needs attention.'
              : session.tests.length
                ? 'The sample checks passed.'
                : 'Verification has not run.'}
          </h3>
          <p>
            {!verificationComplete && session.tests.length
              ? (report.blockingReason ??
                'The report is not marked as simulated verification. Run the demo checks again.')
              : session.tests.length
                ? `${passed} simulated ${passed === 1 ? 'pass' : 'passes'}, ${skipped} skipped. All ${report.requiredTotal} required demo checks passed. No real source verification has occurred.`
                : 'Run the demonstration checks before approving the proposal.'}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/app/repairs/${session.id}/tests`}>
            {session.tests.length ? 'View report' : 'Run checks'}
            <ArrowRight size={13} />
          </Link>
        </Button>
      </div>
      {session.error && (
        <p className="review-recovery-note" role="status">
          {session.error}
        </p>
      )}
      <div className="review-protection">
        <LockKeyhole size={19} />
        <div>
          <h3>Your original project has not been modified.</h3>
          <p>
            {rejected
              ? 'The demo proposal has been discarded. This history records your decision only.'
              : 'Changes remain in the simulated working copy. This demo can record a decision, but it cannot apply files or deploy your website.'}
          </p>
        </div>
      </div>
      {session.decision === 'undecided' ? (
        <div className="review-actions">
          <div>
            <h3>The final call is yours.</h3>
            <p>
              {canApprove(session)
                ? 'All required demo checks passed. Review, then decide.'
                : 'Approval unlocks after the required demo checks pass.'}
            </p>
          </div>
          <div>
            <Button
              variant="ghost"
              disabled={recordingDecision || session.status === 'VERIFYING'}
              onClick={() => setDialog('reject')}
            >
              <X size={14} />
              Reject repair
            </Button>
            <Button
              disabled={recordingDecision || !canApprove(session)}
              onClick={() => setDialog('approve')}
            >
              <Check size={14} />
              Approve changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="decision-record">
          <div>
            <Badge>{approved ? 'Demo approved' : 'Demo rejected'}</Badge>
            <p>
              {approved
                ? 'Approval recorded · application not performed · no deployment'
                : 'Rejection recorded · simulated working copy discarded'}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              const next = await mockRepairService.create(session.projectId)
              navigate(`/app/repairs/${next.id}/diagnosis`)
            }}
          >
            Start a new demo
            <ArrowRight size={14} />
          </Button>
        </div>
      )}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDialog(null)
        }}
      >
        <DialogContent
          className="decision-dialog"
          closeDisabled={busy}
          aria-busy={busy}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault()
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault()
          }}
        >
          <span className="decision-dialog-icon">
            {dialog === 'approve' ? <Shield size={25} /> : <X size={25} />}
          </span>
          <DialogTitle className="dialog-title">
            {dialog === 'approve' ? 'Approve this demo repair?' : 'Reject this demo repair?'}
          </DialogTitle>
          <DialogDescription className="dialog-description">
            {dialog === 'approve'
              ? `Record your explicit approval for ${project.name}. This is a simulated decision; no original files will be applied or deployed.`
              : `Reject the proposal for ${project.name}. The simulated working copy will be marked discarded. Original files stay unchanged.`}
          </DialogDescription>
          <div className="decision-file-list">
            <span className="eyebrow">
              {dialog === 'approve' ? 'PROPOSED FILES / NOT APPLIED' : 'PROPOSED FILES / DISCARD'}
            </span>
            {modifiedFiles.map((file) => (
              <span className="mono" key={file.path}>
                <FileCode2 size={12} />
                {file.path}
              </span>
            ))}
          </div>
          <div className="dialog-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setDialog(null)}>
              Keep reviewing
            </Button>
            <Button
              variant={dialog === 'reject' ? 'danger' : 'primary'}
              disabled={busy}
              onClick={() => void decide()}
            >
              {busy
                ? 'Recording decision…'
                : dialog === 'approve'
                  ? 'Confirm demo approval'
                  : 'Confirm demo rejection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
