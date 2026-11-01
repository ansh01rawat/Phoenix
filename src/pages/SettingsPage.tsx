import { Monitor, PanelLeft, Accessibility, LaptopMinimal } from 'lucide-react'
import { PageHeading } from '@/components/shared/PageHeading'
import { PageTransition } from '@/components/shared/PageTransition'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useUiStore } from '@/store/ui-store'

export function SettingsPage() {
  const { sidebarCollapsed, toggleSidebar, reduceMotion, setReduceMotion } = useUiStore()
  return (
    <PageTransition className="page-container settings-page">
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Workspace settings"
        description="A few thoughtful preferences for the way you work."
      />
      <section className="settings-section" aria-labelledby="appearance-heading">
        <div className="settings-section-heading">
          <h2 id="appearance-heading">Appearance</h2>
          <p>Make room for what matters.</p>
        </div>
        <div className="settings-surface">
          <div className="setting-row">
            <span className="setting-icon">
              <Monitor size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3>Theme</h3>
              <p>A calm, dark canvas for focused work.</p>
            </div>
            <Badge>Dark</Badge>
          </div>
          <div className="setting-row">
            <span className="setting-icon">
              <PanelLeft size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="compact-label">Compact sidebar</h3>
              <p id="compact-description">More space for your workspace on desktop.</p>
            </div>
            <Switch
              checked={sidebarCollapsed}
              onCheckedChange={toggleSidebar}
              aria-labelledby="compact-label"
              aria-describedby="compact-description"
            />
          </div>
          <div className="setting-row">
            <span className="setting-icon">
              <Accessibility size={19} strokeWidth={1.5} />
            </span>
            <div>
              <h3 id="motion-label">Reduce motion</h3>
              <p id="motion-description">
                Keep transitions still. Your system preference is always respected.
              </p>
            </div>
            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              aria-labelledby="motion-label"
              aria-describedby="motion-description"
            />
          </div>
        </div>
        <p className="settings-local-note">Preferences are saved in this browser.</p>
      </section>
      <section className="settings-about" aria-labelledby="about-heading">
        <p className="eyebrow" id="about-heading">
          ABOUT THIS WORKSPACE
        </p>
        <div>
          <span>
            Phoenix <Badge>v0.1 · Early access</Badge>
          </span>
          <span className="muted">
            Local preview
            <LaptopMinimal size={13} />
          </span>
        </div>
        <p>
          This is a frontend demonstration. There is no account, backend connection, or active
          sandbox.
        </p>
      </section>
    </PageTransition>
  )
}
