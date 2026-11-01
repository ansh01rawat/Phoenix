import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  MoreHorizontal,
  Check,
  FlaskConical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PreviewScenario, PreviewVersion } from '@/types/repair'

export function PreviewToolbar({
  version,
  viewport,
  scenario,
  loading,
  onVersionChange,
  onViewportChange,
  onScenarioChange,
  onRefresh,
}: {
  version: PreviewVersion
  viewport: number
  scenario: PreviewScenario
  loading: boolean
  onVersionChange: (version: PreviewVersion) => void
  onViewportChange: (width: number) => void
  onScenarioChange: (scenario: PreviewScenario) => void
  onRefresh: () => void
}) {
  return (
    <div className="preview-toolbar">
      <div className="segmented-control" role="group" aria-label="Preview version">
        {(['original', 'repaired'] as const).map((value) => (
          <button
            key={value}
            aria-pressed={version === value}
            onClick={() => onVersionChange(value)}
          >
            {value === 'original' ? 'Original' : 'Repaired'}
          </button>
        ))}
      </div>
      <div className="viewport-controls" role="group" aria-label="Preview viewport">
        {[
          { width: 1280, label: 'Desktop', icon: Monitor },
          { width: 768, label: 'Tablet', icon: Tablet },
          { width: 390, label: 'Mobile', icon: Smartphone },
        ].map(({ width, label, icon: Icon }) => (
          <button
            key={width}
            aria-label={label}
            aria-pressed={viewport === width}
            onClick={() => onViewportChange(width)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="preview-toolbar-actions">
        <Button variant="ghost" size="icon" aria-label="Refresh preview" onClick={onRefresh}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Preview demo scenarios">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="dropdown-label preview-scenario-label">
              <FlaskConical size={12} />
              Preview demonstration
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dropdown-separator" />
            <DropdownMenuItem onSelect={() => onScenarioChange('available')}>
              Available sample{scenario === 'available' && <Check size={13} className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onScenarioChange('unavailable')}>
              Unavailable sample
              {scenario === 'unavailable' && <Check size={13} className="ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
