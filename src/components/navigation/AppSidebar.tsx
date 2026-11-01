import { Link, NavLink, useNavigate, useLocation } from 'react-router'
import {
  ArrowUpRight,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  Shield,
  Check,
} from 'lucide-react'
import { mainNavigation, workspaceNavigation } from '@/config/navigation'
import { PhoenixMark } from '@/components/shared/PhoenixMark'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUiStore } from '@/store/ui-store'
import { useProjectStore } from '@/store/project-store'
import { displaySessionId } from '@/services/mock/repairService'

export function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const sessions = useProjectStore((state) => state.sessions)
  const { toggleSidebar, setCommandOpen, setGuideOpen } = useUiStore()
  const go = (to: string) => {
    navigate(to)
    onNavigate?.()
  }
  const activeRepair = pathname.match(/^\/app\/repairs\/([^/]+)\//)?.[1]
  const navItems = [
    ...mainNavigation,
    {
      ...workspaceNavigation,
      to: activeRepair ? `/app/repairs/${activeRepair}` : workspaceNavigation.to,
      end: false,
    },
  ]

  return (
    <div className="sidebar-content" data-collapsed={collapsed}>
      <div className="sidebar-brand-row">
        {collapsed ? (
          <Tooltip label="Expand sidebar">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Expand sidebar">
              <PhoenixMark />
            </Button>
          </Tooltip>
        ) : (
          <>
            <Link className="brand" to="/app" aria-label="Phoenix home" onClick={onNavigate}>
              <span className="brand-symbol">
                <PhoenixMark />
              </span>
              <span>
                Phoenix<span className="brand-period">.</span>
              </span>
            </Link>
            <Tooltip label="Collapse sidebar">
              <Button
                className="desktop-collapse"
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="workspace-selector" aria-label="Choose workspace">
            <span className="workspace-avatar">P</span>
            <span className="sidebar-copy">
              <span>Personal workspace</span>
              <small>Local environment</small>
            </span>
            <ChevronsUpDown size={13} className="sidebar-copy muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side={collapsed ? 'right' : 'bottom'}
          className="workspace-menu"
        >
          <DropdownMenuLabel className="dropdown-label">Your workspace</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => go('/app')}>
            <span className="workspace-avatar small">P</span>Personal workspace
            <Check size={14} className="ml-auto accent-text" />
          </DropdownMenuItem>
          <DropdownMenuSeparator className="dropdown-separator" />
          <DropdownMenuItem onSelect={() => go('/app/settings')}>
            <Settings2 size={15} />
            Workspace settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip label="Jump to a page · Ctrl K">
        <button
          className="sidebar-search"
          onClick={() => {
            setCommandOpen(true)
            onNavigate?.()
          }}
          aria-label="Open page navigation"
        >
          <Search size={15} />
          <span className="sidebar-copy">Jump to…</span>
          <kbd className="sidebar-copy">Ctrl K</kbd>
        </button>
      </Tooltip>
      <Tooltip label="New repair">
        <Button asChild variant="secondary" className="new-repair-button">
          <Link to="/app/repairs/new" onClick={onNavigate} aria-label="New repair">
            <Plus size={15} />
            <span className="sidebar-copy">New repair</span>
            <span className="sidebar-copy new-repair-shortcut">↗</span>
          </Link>
        </Button>
      </Tooltip>

      <div className="sidebar-section-label sidebar-copy">Workspace</div>
      <nav className="sidebar-navigation" aria-label="Main navigation">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <Tooltip key={label} label={label}>
            <NavLink end={end} to={to} onClick={onNavigate} aria-label={label} className="nav-item">
              <Icon size={17} strokeWidth={1.7} />
              <span className="sidebar-copy">{label}</span>
              {label === 'Repair workspace' && <span className="nav-demo sidebar-copy">DEMO</span>}
            </NavLink>
          </Tooltip>
        ))}
      </nav>
      <div className="sidebar-recents sidebar-copy">
        <div className="sidebar-section-label">Recent sessions</div>
        {sessions.slice(0, 3).map((session) => (
          <Link
            key={session.id}
            className="recent-session-link"
            to={`/app/repairs/${session.id}/diagnosis`}
            onClick={onNavigate}
          >
            <span className="tiny-dot" />
            <span>{displaySessionId(session.id)}</span>
            <small>{session.decision === 'undecided' ? 'Demo' : session.decision}</small>
          </Link>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-note sidebar-copy">
          <Shield size={17} strokeWidth={1.6} />
          <h3>Room to repair. Space to trust.</h3>
          <p>
            An isolated copy.
            <br />A clear view. Your decision.
          </p>
          <button
            onClick={() => {
              setGuideOpen(true)
              onNavigate?.()
            }}
          >
            Meet Phoenix <ArrowUpRight size={13} />
          </button>
        </div>
        <Tooltip label="How Phoenix works">
          <button
            className="nav-item"
            aria-label="How Phoenix works"
            onClick={() => {
              setGuideOpen(true)
              onNavigate?.()
            }}
          >
            <CircleHelp size={17} strokeWidth={1.7} />
            <span className="sidebar-copy">How Phoenix works</span>
            <ArrowUpRight size={13} className="sidebar-copy ml-auto" />
          </button>
        </Tooltip>
        <Tooltip label="Settings">
          <NavLink
            to="/app/settings"
            onClick={onNavigate}
            aria-label="Settings"
            className="nav-item"
          >
            <Settings2 size={17} strokeWidth={1.7} />
            <span className="sidebar-copy">Settings</span>
          </NavLink>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="account-button" aria-label="Local workspace menu">
              <span className="account-avatar">P</span>
              <span className="sidebar-copy">
                <span>Personal workspace</span>
                <small>On your machine</small>
              </span>
              <ChevronDown size={14} className="sidebar-copy ml-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuLabel className="dropdown-label">
              Local preview · no account connected
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => go('/app/settings')}>
              <Settings2 size={15} />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setGuideOpen(true)
                onNavigate?.()
              }}
            >
              <CircleHelp size={15} />
              About Phoenix
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  return (
    <aside className="app-sidebar" aria-label="Workspace sidebar">
      <SidebarContent collapsed={collapsed} />
    </aside>
  )
}
