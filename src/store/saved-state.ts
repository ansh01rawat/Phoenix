import { REPAIR_STATUSES, type Project, type RepairSession, type TestResult } from '@/types/repair'
import { reportStorageRecovery } from './browser-storage'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string'
const identifier = (value: unknown): value is string =>
  text(value) && /^[a-z0-9][a-z0-9_-]*$/i.test(value)
const date = (value: unknown): value is string => text(value) && Number.isFinite(Date.parse(value))

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    identifier(value.id) &&
    text(value.name) &&
    date(value.updatedAt) &&
    ['framework', 'description', 'color', 'sourceName'].every(
      (key) => value[key] === undefined || text(value[key]),
    )
  )
}

function isTest(value: unknown): value is TestResult {
  return (
    isRecord(value) &&
    identifier(value.id) &&
    text(value.name) &&
    text(value.description) &&
    text(value.log) &&
    (value.required === undefined || typeof value.required === 'boolean') &&
    text(value.status) &&
    ['passed', 'failed', 'skipped'].includes(value.status) &&
    typeof value.duration === 'number' &&
    Number.isFinite(value.duration) &&
    value.duration >= 0
  )
}

export function restoreProjects(value: unknown, fallback: Project[]): Project[] {
  if (!Array.isArray(value)) {
    reportStorageRecovery()
    return fallback
  }
  const ids = new Set<string>()
  const projects = value.filter((entry): entry is Project => {
    if (!isProject(entry) || ids.has(entry.id)) return false
    ids.add(entry.id)
    return true
  })
  if (projects.length !== value.length) reportStorageRecovery()
  return projects
}

export function restoreSessions(
  value: unknown,
  projects: Project[],
  fallback: RepairSession[],
): RepairSession[] {
  if (!Array.isArray(value)) {
    reportStorageRecovery()
    return fallback.filter((session) =>
      projects.some((project) => project.id === session.projectId),
    )
  }
  const sessions: RepairSession[] = []
  const ids = new Set<string>()
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      !identifier(entry.id) ||
      ids.has(entry.id) ||
      !projects.some((project) => project.id === entry.projectId) ||
      !text(entry.title) ||
      !text(entry.sourceName) ||
      !date(entry.createdAt) ||
      entry.executionMode !== 'demo' ||
      entry.scenario !== 'storefront' ||
      !REPAIR_STATUSES.includes(entry.status as RepairSession['status']) ||
      !text(entry.decision) ||
      !['undecided', 'approved', 'rejected'].includes(entry.decision)
    ) {
      reportStorageRecovery()
      continue
    }
    ids.add(entry.id)
    const tests = Array.isArray(entry.tests) ? entry.tests.filter(isTest) : []
    const reportDamaged = !Array.isArray(entry.tests) || tests.length !== entry.tests.length
    const corrected =
      reportDamaged ||
      entry.application !== 'not_applied' ||
      !['unverified', 'simulated'].includes(String(entry.verification)) ||
      !['simulated', 'discarded'].includes(String(entry.sandbox)) ||
      typeof entry.activityStep !== 'number' ||
      !Number.isInteger(entry.activityStep) ||
      entry.activityStep < 0 ||
      entry.activityStep > 6 ||
      (entry.decision === 'undecided' && ['APPROVED', 'REJECTED'].includes(String(entry.status))) ||
      (entry.decision === 'rejected' && entry.sandbox !== 'discarded') ||
      (entry.decision !== 'rejected' && entry.sandbox !== 'simulated')
    if (corrected) reportStorageRecovery()
    const decision = entry.decision as RepairSession['decision']
    const status =
      decision === 'rejected'
        ? 'REJECTED'
        : decision === 'approved'
          ? 'APPROVED'
          : (reportDamaged &&
                ['VERIFYING', 'READY_FOR_REVIEW', 'APPROVAL_PENDING'].includes(
                  String(entry.status),
                )) ||
              ['APPROVED', 'REJECTED'].includes(String(entry.status))
            ? 'REPAIR_READY'
            : (entry.status as RepairSession['status'])
    sessions.push({
      id: entry.id,
      projectId: entry.projectId as string,
      title: entry.title,
      sourceName: entry.sourceName,
      createdAt: entry.createdAt,
      scenario: 'storefront',
      executionMode: 'demo',
      application: 'not_applied',
      decision,
      status,
      sandbox: decision === 'rejected' ? 'discarded' : 'simulated',
      activityStep:
        typeof entry.activityStep === 'number' && Number.isFinite(entry.activityStep)
          ? Math.min(6, Math.max(0, Math.floor(entry.activityStep)))
          : 0,
      verification:
        !reportDamaged && entry.verification === 'simulated' ? 'simulated' : 'unverified',
      tests: reportDamaged ? [] : tests,
      error: reportDamaged
        ? 'The saved demo report was incomplete. Run the demonstration checks again before approving.'
        : text(entry.error)
          ? entry.error
          : undefined,
    })
  }
  return sessions
}
