import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { LockKeyhole } from 'lucide-react'
import { AppSidebar, SidebarContent } from '@/components/navigation/AppSidebar'
import { AppHeader } from '@/components/navigation/AppHeader'
import { getPageTitle } from '@/config/navigation'
import { CommandMenu } from '@/components/navigation/CommandMenu'
import { PhoenixGuide } from '@/components/shared/PhoenixGuide'
import { LoadingState } from '@/components/shared/LoadingState'
import { StorageNotice } from '@/components/shared/StorageNotice'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useUiStore } from '@/store/ui-store'

export function AppLayout() {
  const { sidebarCollapsed, setCommandOpen, toggleSidebar } = useUiStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(!useUiStore.getState().commandOpen)
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen, toggleSidebar])

  useEffect(() => {
    document.title = `${getPageTitle(pathname)} — Phoenix`
    if (!firstRender.current) {
      mainRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    firstRender.current = false
  }, [pathname])

  return (
    <div className="app-frame" data-sidebar-collapsed={sidebarCollapsed}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppSidebar />
      <div className="app-main">
        <AppHeader onOpenMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} />
        <StorageNotice />
        <main id="main-content" ref={mainRef} className="main-content" tabIndex={-1}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="app-statusbar">
          <span>
            <i className="tiny-dot" />
            Local workspace<span className="statusbar-separator">/</span>
            <span className="statusbar-version">Phoenix v0.1</span>
          </span>
          <span>
            <LockKeyhole size={11} />
            Always your decision
          </span>
        </footer>
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent side="left" className="navigation-sheet" closeLabel="Close navigation">
          <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
          <DialogDescription className="sr-only">
            Navigate your personal Phoenix workspace.
          </DialogDescription>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>
      <CommandMenu />
      <PhoenixGuide />
    </div>
  )
}
