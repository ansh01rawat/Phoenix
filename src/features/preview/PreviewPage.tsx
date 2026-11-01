import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  LockKeyhole,
  AppWindow,
  AlertCircle,
  RefreshCw,
  LoaderCircle,
} from 'lucide-react'
import { useRepair } from '@/hooks/use-repair'
import { hasChanges } from '@/services/mock/repairService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PreviewToolbar } from './PreviewToolbar'
import { useSamplePreview } from './use-sample-preview'
import type { PreviewScenario, PreviewVersion } from '@/types/repair'

export function PreviewPage() {
  const { session } = useRepair()
  const [version, setVersion] = useState<PreviewVersion>('repaired')
  const [viewport, setViewport] = useState(1280)
  const [scenario, setScenario] = useState<PreviewScenario>('available')
  const [available, setAvailable] = useState(800)
  const stage = useRef<HTMLDivElement>(null)
  const enabled = hasChanges(session)
  const preview = useSamplePreview(version, scenario, enabled)

  useEffect(() => {
    if (!stage.current || !enabled) return
    const observer = new ResizeObserver(([entry]) =>
      setAvailable(Math.max(1, entry.contentRect.width - 24)),
    )
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [enabled])

  const scale = Math.min(1, available / viewport)
  const loading = preview.status === 'loading'
  if (!enabled)
    return (
      <EmptyState
        icon={AppWindow}
        title={
          session.decision === 'rejected'
            ? 'The demo working copy was discarded.'
            : 'A preview begins with a proposal.'
        }
        description={
          session.decision === 'rejected'
            ? 'This session keeps your decision history. Its sample preview is no longer available, and original files were never changed.'
            : 'Prepare the sample repair in Diagnosis before comparing the two versions.'
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

  const retry = () => {
    setScenario('available')
    preview.refresh()
  }
  return (
    <div className="feature-page preview-page">
      <div className="feature-heading">
        <div>
          <p className="eyebrow">03 / WEBSITE PREVIEW</p>
          <h2>See the difference for yourself.</h2>
          <p>A safe, static illustration of the sample repair. Your ZIP is never executed.</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to={`/app/repairs/${session.id}/tests`}>
            Review checks
            <ArrowRight size={13} />
          </Link>
        </Button>
      </div>
      <PreviewToolbar
        version={version}
        viewport={viewport}
        scenario={scenario}
        loading={loading}
        onVersionChange={setVersion}
        onViewportChange={setViewport}
        onRefresh={preview.refresh}
        onScenarioChange={(value) => {
          setScenario(value)
          preview.refresh()
        }}
      />
      <div
        className="preview-browser"
        role="group"
        aria-label="Sample website preview"
        aria-busy={loading}
      >
        <div className="browser-address">
          <div className="browser-dots">
            <i />
            <i />
            <i />
          </div>
          <span>
            <LockKeyhole size={11} />
            forma.sample / {version}
          </span>
          <Badge>Static demo</Badge>
        </div>
        <div
          ref={stage}
          className={`preview-stage ${preview.status === 'error' ? 'preview-stage-error' : ''}`}
        >
          {loading && (
            <div className="preview-loading" role="status">
              <LoaderCircle size={19} className="spin" />
              <span>Loading sample preview…</span>
            </div>
          )}
          {preview.status === 'error' ? (
            <div className="preview-error" role="alert">
              <span className="preview-error-icon">
                <AlertCircle size={25} strokeWidth={1.5} />
              </span>
              <p className="eyebrow">SAMPLE PREVIEW / UNAVAILABLE</p>
              <h3>A small interruption.</h3>
              <p>{preview.error}</p>
              <Button variant="secondary" onClick={retry}>
                <RefreshCw size={14} />
                Retry sample preview
              </Button>
              <span className="preview-error-note">
                Loads the available demonstration sample. Original files stay untouched.
              </span>
            </div>
          ) : (
            <div
              className="preview-device"
              style={{ width: viewport * scale, height: 730 * scale }}
            >
              {preview.html !== null && (
                <iframe
                  key={preview.requestId}
                  title={`${version === 'original' ? 'Original' : 'Repaired'} sample website`}
                  sandbox=""
                  allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; clipboard-read 'none'; clipboard-write 'none'"
                  referrerPolicy="no-referrer"
                  srcDoc={preview.html}
                  aria-hidden={loading}
                  tabIndex={loading ? -1 : 0}
                  onLoad={() => preview.loaded(preview.requestId)}
                  onError={() => preview.failed(preview.requestId)}
                  style={{
                    width: viewport,
                    height: 730,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div className="preview-footer">
          <span>
            {viewport} × 730 px · {Math.round(scale * 100)}% scale
          </span>
          <span>
            {preview.status === 'error'
              ? 'Preview unavailable · source unchanged'
              : loading
                ? 'Loading the static sample'
                : version === 'original'
                  ? 'Simulated failure illustration'
                  : 'Safe static sample · not a live build'}
          </span>
        </div>
      </div>
      <div className="preview-facts">
        <div>
          <span className="eyebrow">BUILD</span>
          <p>Demonstration fixture</p>
        </div>
        <div>
          <span className="eyebrow">RUNTIME</span>
          <p>No uploaded code executed</p>
        </div>
        <div>
          <span className="eyebrow">ISOLATION</span>
          <p>Sandboxed frame · scripts disabled</p>
        </div>
      </div>
    </div>
  )
}
