import { useProjectStore } from '@/store/project-store'
import { sampleSessions, testFixtures } from './fixtures'
import { summarizeDemoVerification } from './verification'
import type { ArchiveMetadata, ApprovalDecision, RepairSession } from '@/types/repair'

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const jobs = new Map<string, Promise<void>>()
export const hasChanges = (session: RepairSession) =>
  session.sandbox !== 'discarded' &&
  [
    'REPAIR_READY',
    'VERIFYING',
    'READY_FOR_REVIEW',
    'APPROVAL_PENDING',
    'APPROVED',
    'FAILED',
  ].includes(session.status)
export const canApprove = (session: RepairSession) =>
  session.executionMode === 'demo' &&
  session.sandbox === 'simulated' &&
  session.application === 'not_applied' &&
  session.status === 'READY_FOR_REVIEW' &&
  session.decision === 'undecided' &&
  session.verification === 'simulated' &&
  summarizeDemoVerification(session.tests).complete
export const displaySessionId = (id: string) => (id === 'demo' ? 'PX-1042' : id.toUpperCase())

export const mockRepairService = {
  async create(projectId = 'forma', archive?: ArchiveMetadata) {
    const store = useProjectStore.getState()
    const id = `px-${crypto.randomUUID().slice(0, 8)}`
    const project = archive
      ? {
          id: `project-${id}`,
          name: archive.name.replace(/\.zip$/i, ''),
          framework: 'Source selected locally',
          description: 'Local ZIP selection · sample repair scenario',
          updatedAt: new Date().toISOString(),
          sourceName: archive.name,
          color: '#a99ac6',
        }
      : undefined
    const session: RepairSession = {
      ...structuredClone(sampleSessions[0]),
      id,
      projectId: project?.id ?? projectId,
      createdAt: new Date().toISOString(),
      sourceName:
        archive?.name ??
        store.projects.find((item) => item.id === projectId)?.sourceName ??
        'sample-project.zip',
    }
    store.addSession(session, project)
    return session
  },
  diagnose(id: string) {
    if (jobs.has(id)) return jobs.get(id)!
    const session = useProjectStore.getState().sessions.find((item) => item.id === id)
    if (
      !session ||
      session.executionMode !== 'demo' ||
      !['IMPORTED', 'FAILED'].includes(session.status) ||
      session.decision !== 'undecided'
    )
      return Promise.reject(new Error('This session cannot start a diagnosis.'))
    const job = (async () => {
      const update = useProjectStore.getState().updateSession
      update(id, { error: undefined, activityStep: 0, tests: [], verification: 'unverified' })
      for (const [index, status] of (
        ['ISOLATING', 'DIAGNOSING', 'DIAGNOSING', 'PLANNING_REPAIR', 'REPAIRING'] as const
      ).entries()) {
        update(id, { status, activityStep: index + 1 })
        await pause(380)
      }
      update(id, { status: 'REPAIR_READY', activityStep: 6 })
    })().finally(() => jobs.delete(id))
    jobs.set(id, job)
    return job
  },
  async verify(id: string, outcome: 'passed' | 'failed' = 'passed') {
    if (jobs.has(id)) throw new Error('A demonstration step is already running.')
    const session = useProjectStore.getState().sessions.find((item) => item.id === id)
    if (
      !session ||
      session.executionMode !== 'demo' ||
      !hasChanges(session) ||
      session.decision !== 'undecided'
    )
      throw new Error('Prepare the proposed repair before running checks.')
    const job = (async () => {
      const update = useProjectStore.getState().updateSession
      update(id, { status: 'VERIFYING', verification: 'unverified', tests: [], error: undefined })
      await pause(1500)
      const tests = structuredClone(testFixtures)
      if (outcome === 'failed')
        tests[2] = {
          ...tests[2],
          status: 'failed',
          log: 'DEMO FAILURE SCENARIO\nExpected: empty state for undefined data\nReceived: sample runtime exception\nThis intentionally simulated failure blocks approval.',
        }
      update(id, {
        tests,
        verification: 'simulated',
        status: outcome === 'failed' ? 'FAILED' : 'READY_FOR_REVIEW',
      })
    })().finally(() => jobs.delete(id))
    jobs.set(id, job)
    await job
  },
  async decide(id: string, decision: Exclude<ApprovalDecision, 'undecided'>) {
    const session = useProjectStore.getState().sessions.find((item) => item.id === id)
    if (
      !session ||
      session.executionMode !== 'demo' ||
      session.decision !== 'undecided' ||
      jobs.has(id)
    )
      throw new Error('This session cannot accept a decision right now.')
    if (decision === 'approved' && !canApprove(session))
      throw new Error('All required demonstration checks must pass before approval.')
    if (decision === 'rejected' && !(hasChanges(session) || session.status === 'FAILED'))
      throw new Error('There is no proposed repair to reject.')
    const previousStatus = session.status
    const update = useProjectStore.getState().updateSession
    if (decision === 'approved') update(id, { status: 'APPROVAL_PENDING', error: undefined })
    const job = (async () => {
      try {
        await pause(350)
        const current = useProjectStore.getState().sessions.find((item) => item.id === id)
        if (!current || current.decision !== 'undecided')
          throw new Error('A decision has already been recorded for this session.')
        if (decision === 'approved' && !canApprove({ ...current, status: previousStatus }))
          throw new Error('The verification report changed. Review the checks before approving.')
        update(id, {
          decision,
          status: decision === 'approved' ? 'APPROVED' : 'REJECTED',
          application: 'not_applied',
          sandbox: decision === 'rejected' ? 'discarded' : 'simulated',
          error: undefined,
        })
      } catch (error) {
        const current = useProjectStore.getState().sessions.find((item) => item.id === id)
        if (current?.status === 'APPROVAL_PENDING')
          update(id, {
            status:
              current.verification === 'simulated' &&
              summarizeDemoVerification(current.tests).complete
                ? 'READY_FOR_REVIEW'
                : current.tests.some((test) => test.status === 'failed')
                  ? 'FAILED'
                  : 'REPAIR_READY',
          })
        throw error
      }
    })().finally(() => jobs.delete(id))
    jobs.set(id, job)
    await job
  },
}
