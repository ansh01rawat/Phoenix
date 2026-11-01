import { Link, useLocation } from 'react-router'
import { ChevronRight, CircleHelp, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useUiStore } from '@/store/ui-store'
import { getPageTitle } from '@/config/navigation'

export function AppHeader({ onOpenMenu, menuOpen }: { onOpenMenu: () => void; menuOpen: boolean }) {
  const { pathname } = useLocation()
  const { setCommandOpen, setGuideOpen } = useUiStore()
  return (
    <header className="app-header">
      <div className="header-leading">
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          onClick={onOpenMenu}
        >
          <Menu size={20} />
        </Button>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/app">Workspace</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span aria-current="page">{getPageTitle(pathname)}</span>
        </nav>
      </div>
      <div className="header-actions">
        <Tooltip label="Jump to a page · Ctrl K" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            className="header-search"
            aria-label="Open page navigation"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={16} />
          </Button>
        </Tooltip>
        <span className="header-divider" />
        <StatusBadge status="demo" />
        <Tooltip label="How Phoenix works" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open Phoenix guide"
            onClick={() => setGuideOpen(true)}
          >
            <CircleHelp size={17} />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
