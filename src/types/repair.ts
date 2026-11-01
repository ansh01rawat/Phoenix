export type ExecutionMode = 'demo' | 'live'

export const REPAIR_STATUSES = [
  'IDLE',
  'IMPORTING',
  'IMPORTED',
  'ISOLATING',
  'DIAGNOSING',
  'PLANNING_REPAIR',
  'REPAIRING',
  'REPAIR_READY',
  'VERIFYING',
  'READY_FOR_REVIEW',
  'APPROVAL_PENDING',
  'APPROVED',
  'REJECTED',
  'FAILED',
] as const

export type RepairStatus = (typeof REPAIR_STATUSES)[number]
export type RepairStage = 'diagnosis' | 'changes' | 'preview' | 'tests' | 'review'
export type VerificationStatus = 'unverified' | 'simulated' | 'passed' | 'failed'
export type ApprovalDecision = 'undecided' | 'approved' | 'rejected'
export type ApplicationStatus = 'not_applied' | 'applying' | 'applied' | 'failed'

export interface Project {
  id: string
  name: string
  framework?: string
  updatedAt: string
  description?: string
  color?: string
  sourceName?: string
}

export interface RepairSession {
  id: string
  projectId: string
  executionMode: ExecutionMode
  status: RepairStatus
  verification: VerificationStatus
  decision: ApprovalDecision
  application: ApplicationStatus
  title: string
  createdAt: string
  sourceName: string
  scenario: 'storefront'
  activityStep: number
  tests: TestResult[]
  sandbox: 'simulated' | 'discarded'
  error?: string
}

export interface DetectedIssue {
  id: string
  title: string
  severity: 'high' | 'medium'
  description: string
  file: string
  line: number
  evidence: string
  explanation: string
}
export interface RepairPlan {
  title: string
  steps: string[]
  scope: string
}
export interface ModifiedFile {
  path: string
  original: string
  modified: string
  summary: string
  reason: string
}
export interface CodeChange {
  kind: 'equal' | 'added' | 'removed'
  text: string
  oldLine?: number
  newLine?: number
}
export interface TestResult {
  id: string
  /** Omitted legacy values are treated as required by the demo manifest. */
  required?: boolean
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  description: string
  log: string
}
export interface ArchiveMetadata {
  name: string
  size: number
  entries: number
}

export type PreviewVersion = 'original' | 'repaired'
export type PreviewScenario = 'available' | 'unavailable'
export interface PreviewDocument {
  html: string
  version: PreviewVersion
  mode: 'static-demo'
}
