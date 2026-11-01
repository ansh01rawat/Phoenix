import { Box, Files, LockKeyhole, ShieldCheck } from 'lucide-react'
import { PhoenixMark } from '@/components/shared/PhoenixMark'

/** An explanatory diagram, not a status visualization of a running repair. */
export function WorkflowBlueprint() {
  return (
    <div className="workflow-blueprint" aria-hidden="true">
      <div className="blueprint-grid" />
      <span className="blueprint-caption mono">THE PHOENIX APPROACH</span>
      <svg className="blueprint-connectors" viewBox="0 0 420 300" fill="none">
        <path d="M103 87V133Q103 143 113 143H209" />
        <path d="M310 174V220Q310 230 300 230H185" />
        <circle cx="103" cy="87" r="3" />
        <circle cx="185" cy="230" r="3" />
      </svg>
      <div className="blueprint-node source-node">
        <span className="blueprint-node-icon">
          <Files size={20} strokeWidth={1.4} />
        </span>
        <div>
          <span className="mono">01 / ORIGINAL</span>
          <strong>Your source</strong>
        </div>
        <LockKeyhole size={12} className="node-lock" />
      </div>
      <div className="blueprint-source-caption mono">UNTOUCHED</div>
      <div className="blueprint-node sandbox-node">
        <span className="blueprint-phoenix">
          <PhoenixMark />
        </span>
        <div>
          <span className="mono">02 / WORKING COPY</span>
          <strong>Room to repair</strong>
          <small>
            <Box size={10} />
            Isolated by design
          </small>
        </div>
        <span className="node-spark">✦</span>
      </div>
      <div className="blueprint-node decision-node">
        <span className="blueprint-node-icon">
          <ShieldCheck size={20} strokeWidth={1.4} />
        </span>
        <div>
          <span className="mono">03 / YOUR DECISION</span>
          <strong>Always in control</strong>
        </div>
      </div>
    </div>
  )
}
