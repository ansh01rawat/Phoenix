import { useNavigate } from 'react-router'
import {
  ArrowUpRight,
  Upload,
  ScanLine,
  FileDiff,
  ListChecks,
  ShieldCheck,
  FlaskConical,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PhoenixMark } from '@/components/shared/PhoenixMark'
import { useUiStore } from '@/store/ui-store'

const steps = [
  {
    icon: Upload,
    title: 'Start with your source',
    description: 'Import a website to begin with an isolated working copy.',
  },
  {
    icon: ScanLine,
    title: 'Understand the problem',
    description: 'Follow the investigation and read the proposed repair plan.',
  },
  {
    icon: FileDiff,
    title: 'Inspect every change',
    description: 'Compare the code and understand why it would change.',
  },
  {
    icon: ListChecks,
    title: 'Look for the evidence',
    description: 'Review the website preview and supported verification results.',
  },
  {
    icon: ShieldCheck,
    title: 'Make the final call',
    description: 'Explicitly approve or reject the proposal. Deployment is never automatic.',
  },
]

export function PhoenixGuide() {
  const { guideOpen, setGuideOpen } = useUiStore()
  const navigate = useNavigate()
  return (
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
      <DialogContent className="guide-dialog">
        <div className="guide-brand">
          <PhoenixMark />
        </div>
        <p className="eyebrow">A considered approach to repair</p>
        <DialogTitle className="dialog-title">A clearer path back to working.</DialogTitle>
        <DialogDescription className="dialog-description">
          Phoenix is built around trust, transparency, and your control.
        </DialogDescription>
        <ol className="guide-steps">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title}>
              <span className="guide-step-number">0{index + 1}</span>
              <Icon size={18} strokeWidth={1.5} />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="demo-disclosure">
          <FlaskConical size={16} />
          <p>
            This demonstration has no connected backend. Diagnosis, repair, previews, and checks use
            a sample fixture. No selected source files are uploaded, executed, or changed.
          </p>
        </div>
        <Button
          onClick={() => {
            setGuideOpen(false)
            navigate('/app/repairs/demo/diagnosis')
          }}
        >
          Explore the workspace
          <ArrowUpRight size={15} />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
