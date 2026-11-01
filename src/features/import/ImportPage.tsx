import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  Upload,
  FileArchive,
  Shield,
  ArrowRight,
  X,
  FlaskConical,
  AlertCircle,
  Check,
  Download,
} from 'lucide-react'
import { PageHeading } from '@/components/shared/PageHeading'
import { PageTransition } from '@/components/shared/PageTransition'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { validateArchive } from '@/services/mock/importService'
import { mockRepairService } from '@/services/mock/repairService'
import type { ArchiveMetadata } from '@/types/repair'

type ImportState = 'empty' | 'validating' | 'selected' | 'importing' | 'complete' | 'error'
export function ImportPage() {
  const [state, setState] = useState<ImportState>('empty')
  const [archive, setArchive] = useState<ArchiveMetadata | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  const request = useRef(0)
  const cancel = useRef<AbortController | null>(null)
  const navigate = useNavigate()
  useEffect(
    () => () => {
      request.current++
      cancel.current?.abort()
    },
    [],
  )
  const select = async (files: FileList | File[]) => {
    if (state === 'importing') return
    const nonce = ++request.current
    setError('')
    setArchive(null)
    setState('validating')
    try {
      if (files.length !== 1) throw new Error('Choose one ZIP archive at a time.')
      const metadata = await validateArchive(files[0])
      if (nonce === request.current) {
        setArchive(metadata)
        setState('selected')
      }
    } catch (failure) {
      if (nonce === request.current) {
        setError(
          failure instanceof Error ? failure.message : 'The file could not be read. Try again.',
        )
        setState('error')
      }
    }
    if (picker.current) picker.current.value = ''
  }
  const drop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    void select(event.dataTransfer.files)
  }
  const start = async () => {
    if (!archive) return
    cancel.current = new AbortController()
    const signal = cancel.current.signal
    setState('importing')
    setProgress(0)
    try {
      for (let value = 0; value <= 100; value += 10) {
        if (signal.aborted) return
        setProgress(value)
        await new Promise((resolve) => setTimeout(resolve, 85))
      }
      if (signal.aborted) return
      const session = await mockRepairService.create('forma', archive)
      setState('complete')
      navigate(`/app/repairs/${session.id}/diagnosis`)
    } catch {
      setError('The simulated import could not finish. Your selected file was not uploaded.')
      setState('error')
    }
  }
  return (
    <PageTransition className="page-container import-page">
      <PageHeading
        eyebrow="A FRESH START"
        title="Bring your website to Phoenix."
        description="Start with your source. Keep the original in your hands."
      />
      <div className="import-layout">
        <section className="import-card">
          <div className="import-card-heading">
            <span className="step-dot">01</span>
            <div>
              <h2>Choose your source</h2>
              <p>A ZIP archive is all you need to get started.</p>
            </div>
            <Badge variant="accent">Demo import</Badge>
          </div>
          <input
            ref={picker}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            aria-label="Choose ZIP archive"
            onChange={(event) => event.target.files && void select(event.target.files)}
            disabled={state === 'importing'}
          />
          <div
            className={`file-dropzone ${dragging ? 'file-dropzone-drag' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
          >
            {archive ? (
              <>
                <div className="file-selected-icon">
                  <FileArchive size={30} strokeWidth={1.3} />
                </div>
                <h3>{archive.name}</h3>
                <p>
                  {(archive.size / 1024).toFixed(1)} KB · {archive.entries} archive entries
                </p>
                <Badge>
                  <Check size={12} />
                  ZIP header checked
                </Badge>
                {state === 'importing' ? (
                  <div className="upload-progress">
                    <div className="progress-caption">
                      <span>Simulated import</span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label="Simulated import progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        cancel.current?.abort()
                        setState('selected')
                      }}
                    >
                      Cancel simulation
                    </Button>
                  </div>
                ) : (
                  <button
                    className="text-link"
                    onClick={() => {
                      ++request.current
                      setArchive(null)
                      setState('empty')
                    }}
                  >
                    <X size={12} />
                    Remove file
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="upload-glyph">
                  <Upload size={27} strokeWidth={1.4} />
                </span>
                <h3>
                  {state === 'validating'
                    ? 'Checking the ZIP header…'
                    : dragging
                      ? 'A good place to drop it.'
                      : 'Drop your website here'}
                </h3>
                <p>or choose a file from your computer</p>
                <Button
                  variant="secondary"
                  onClick={() => picker.current?.click()}
                  disabled={state === 'validating'}
                >
                  Choose ZIP file
                </Button>
                <span className="dropzone-format">.zip format · up to 20 MB</span>
              </>
            )}
          </div>
          {error && (
            <div className="inline-error" role="alert">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}
          <div className="import-demo-note">
            <FlaskConical size={16} />
            <p>
              <strong>A transparent demonstration.</strong> Files stay in this browser. Only the ZIP
              header and directory metadata are checked. Import, diagnosis, and repairs use the
              Forma sample scenario, not your archive contents.
            </p>
          </div>
          <div className="import-actions">
            <span>No source is uploaded.</span>
            <Button onClick={() => void start()} disabled={!archive || state !== 'selected'}>
              Start demo repair
              <ArrowRight size={15} />
            </Button>
          </div>
        </section>
        <aside className="import-aside">
          <div className="protection-card">
            <Shield size={24} strokeWidth={1.3} />
            <h2>Your original project stays untouched.</h2>
            <p>
              Phoenix is designed to investigate and repair an isolated working copy. Applying
              changes always requires your explicit approval.
            </p>
            <div className="protection-rule">
              <span />
              No automatic deployment
            </div>
            <div className="protection-rule">
              <span />
              Every change open for review
            </div>
            <div className="protection-rule">
              <span />
              Your decision, at every step
            </div>
          </div>
          <div className="sample-card">
            <p className="eyebrow">JUST LOOKING AROUND?</p>
            <h3>Start with something familiar.</h3>
            <p>Explore a storefront with a reproducible rendering failure.</p>
            <Button
              variant="secondary"
              onClick={async () => {
                const session = await mockRepairService.create()
                navigate(`/app/repairs/${session.id}/diagnosis`)
              }}
            >
              Use sample project
              <ArrowRight size={14} />
            </Button>
            <a href="/demo/forma-storefront.zip" download className="text-link">
              <Download size={13} />
              Download sample ZIP
            </a>
          </div>
        </aside>
      </div>
    </PageTransition>
  )
}
