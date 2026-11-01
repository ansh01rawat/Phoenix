import {
  LayoutGrid,
  FolderKanban,
  History,
  PanelsTopLeft,
  Settings2,
  ScanLine,
  FileDiff,
  AppWindow,
  ListChecks,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import type { RepairStage } from '@/types/repair'

export function getPageTitle(path: string) {
  if (path === '/app') return 'Overview'
  if (path === '/app/repairs/new') return 'New repair'
  if (/^\/app\/repairs\/[^/]+\//.test(path)) return 'Repair workspace'
  if (path === '/app/projects' || path.startsWith('/app/projects/')) return 'Projects'
  if (path === '/app/repairs') return 'Repair history'
  if (path === '/app/settings') return 'Settings'
  return 'Page not found'
}

export const mainNavigation = [
  { label: 'Overview', to: '/app', icon: LayoutGrid, end: true },
  { label: 'Projects', to: '/app/projects', icon: FolderKanban, end: false },
  { label: 'Repair history', to: '/app/repairs', icon: History, end: true },
]

export const workspaceNavigation = {
  label: 'Repair workspace',
  to: '/app/repairs/demo',
  icon: PanelsTopLeft,
}

export const commandDestinations = [
  ...mainNavigation,
  workspaceNavigation,
  { label: 'New repair', to: '/app/repairs/new', icon: Upload },
  { label: 'Settings', to: '/app/settings', icon: Settings2 },
]

export const repairStages = [
  {
    id: 'diagnosis',
    label: 'Diagnosis',
    icon: ScanLine,
    number: '01',
    title: 'Clarity before a single change.',
    description:
      'Understand what went wrong, where it happened, and how a proposed repair would help.',
    emptyLabel: 'No diagnosis has run',
    details: ['Identify the issue', 'Trace the affected files', 'Understand the repair plan'],
  },
  {
    id: 'changes',
    label: 'Changes',
    icon: FileDiff,
    number: '02',
    title: 'Every change, out in the open.',
    description:
      'Compare the original source with the proposed repair and understand the reason behind each change.',
    emptyLabel: 'No changes proposed',
    details: [
      'Explore modified files',
      'Compare original and repaired code',
      'Read the change explanations',
    ],
  },
  {
    id: 'preview',
    label: 'Preview',
    icon: AppWindow,
    number: '03',
    title: 'See the difference for yourself.',
    description:
      'A dedicated preview will let you inspect the working copy across desktop, tablet, and mobile sizes.',
    emptyLabel: 'No preview is running',
    details: [
      'Compare both versions',
      'Explore different screen sizes',
      'Inspect the isolated working copy',
    ],
  },
  {
    id: 'tests',
    label: 'Tests',
    icon: ListChecks,
    number: '04',
    title: 'Confidence needs evidence.',
    description:
      'Verification results will show exactly what was checked, what passed, and what still needs attention.',
    emptyLabel: 'No verification has run',
    details: [
      'Read verification results',
      'Inspect individual test logs',
      'Understand remaining failures',
    ],
  },
  {
    id: 'review',
    label: 'Review',
    icon: ShieldCheck,
    number: '05',
    title: 'The final decision is yours.',
    description:
      'Review the complete picture before explicitly approving or rejecting a proposed repair.',
    emptyLabel: 'No repair is ready for review',
    details: [
      'Review the repair summary',
      'Check the verification evidence',
      'Approve or reject explicitly',
    ],
  },
] satisfies Array<{
  id: RepairStage
  label: string
  icon: typeof ScanLine
  number: string
  title: string
  description: string
  emptyLabel: string
  details: string[]
}>
