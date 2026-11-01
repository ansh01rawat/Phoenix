import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { sampleProjects, sampleSessions } from '@/services/mock/fixtures'
import { summarizeDemoVerification } from '@/services/mock/verification'
import { browserStorage } from './browser-storage'
import { isRecord, restoreProjects, restoreSessions } from './saved-state'
import type { Project, RepairSession } from '@/types/repair'

interface ProjectState {
  projects: Project[]
  sessions: RepairSession[]
  updateSession: (id: string, patch: Partial<RepairSession>) => void
  addSession: (session: RepairSession, project?: Project) => void
}
const recover = (session: RepairSession): RepairSession => {
  if (session.status === 'APPROVAL_PENDING' && session.decision === 'undecided')
    return {
      ...session,
      status: summarizeDemoVerification(session.tests).complete
        ? 'READY_FOR_REVIEW'
        : 'REPAIR_READY',
      application: 'not_applied',
      error:
        'The demo approval was interrupted. Review the proposal and confirm your decision again.',
    }
  if (['ISOLATING', 'DIAGNOSING', 'PLANNING_REPAIR', 'REPAIRING'].includes(session.status))
    return {
      ...session,
      status: 'IMPORTED',
      activityStep: 0,
      tests: [],
      verification: 'unverified',
      error: 'The demonstration was interrupted. Run it again to continue.',
    }
  if (session.status === 'VERIFYING')
    return {
      ...session,
      status: 'REPAIR_READY',
      tests: [],
      verification: 'unverified',
      error: 'Checks were interrupted. Run the demonstration checks again.',
    }
  return session
}
export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: structuredClone(sampleProjects),
      sessions: structuredClone(sampleSessions),
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...patch } : session,
          ),
        })),
      addSession: (session, project) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
          projects: project ? [project, ...state.projects] : state.projects,
        })),
    }),
    {
      name: 'phoenix-demo-v2',
      version: 2,
      storage: createJSONStorage(() => browserStorage),
      partialize: ({ projects, sessions }) => ({ projects, sessions }),
      merge: (persisted, current) => {
        if (!isRecord(persisted)) return current
        const projects = restoreProjects(persisted.projects, current.projects)
        const sessions = restoreSessions(persisted.sessions, projects, current.sessions)
        return {
          ...current,
          projects,
          sessions: sessions.map(recover),
        }
      },
    },
  ),
)
