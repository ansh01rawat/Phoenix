import { lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { MotionConfig } from 'motion/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ToastProvider } from '@/components/shared/ToastProvider'
import { AppLayout } from '@/layouts/AppLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useUiStore } from '@/store/ui-store'

const OverviewPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ProjectsPage = lazy(() =>
  import('@/features/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)
const ProjectDetailPage = lazy(() =>
  import('@/features/projects/ProjectsPage').then((module) => ({
    default: module.ProjectDetailPage,
  })),
)
const RepairHistoryPage = lazy(() =>
  import('@/features/projects/ProjectsPage').then((module) => ({
    default: module.RepairHistoryPage,
  })),
)
const ImportPage = lazy(() =>
  import('@/features/import/ImportPage').then((module) => ({ default: module.ImportPage })),
)
const DiagnosisPage = lazy(() =>
  import('@/features/diagnosis/DiagnosisPage').then((module) => ({
    default: module.DiagnosisPage,
  })),
)
const ChangesPage = lazy(() =>
  import('@/features/code-diff/ChangesPage').then((module) => ({ default: module.ChangesPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const RepairWorkspaceLayout = lazy(() =>
  import('@/layouts/RepairWorkspaceLayout').then((module) => ({
    default: module.RepairWorkspaceLayout,
  })),
)
const PreviewPage = lazy(() =>
  import('@/features/preview/PreviewPage').then((module) => ({ default: module.PreviewPage })),
)
const TestsPage = lazy(() =>
  import('@/features/testing/TestsPage').then((module) => ({ default: module.TestsPage })),
)
const ReviewPage = lazy(() =>
  import('@/features/approval/ReviewPage').then((module) => ({ default: module.ReviewPage })),
)

export default function App() {
  const reduceMotion = useUiStore((state) => state.reduceMotion)
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion)
  }, [reduceMotion])
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
        <TooltipProvider delayDuration={350}>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/app" replace />} />
                <Route element={<AppLayout />}>
                  <Route path="/app" element={<OverviewPage />} />
                  <Route path="/app/projects" element={<ProjectsPage />} />
                  <Route path="/app/projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/app/repairs" element={<RepairHistoryPage />} />
                  <Route path="/app/repairs/new" element={<ImportPage />} />
                  <Route path="/app/settings" element={<SettingsPage />} />
                  <Route path="/app/repairs/:repairId" element={<RepairWorkspaceLayout />}>
                    <Route index element={<Navigate to="diagnosis" replace />} />
                    <Route path="diagnosis" element={<DiagnosisPage />} />
                    <Route path="changes" element={<ChangesPage />} />
                    <Route path="preview" element={<PreviewPage />} />
                    <Route path="tests" element={<TestsPage />} />
                    <Route path="review" element={<ReviewPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </TooltipProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
