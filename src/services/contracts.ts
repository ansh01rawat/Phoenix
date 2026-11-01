import type {
  Project,
  RepairSession,
  PreviewVersion,
  PreviewScenario,
  PreviewDocument,
} from '@/types/repair'

/** Contracts only. Phase 1 does not make backend requests or simulate repairs. */
export interface ProjectService {
  list: (signal?: AbortSignal) => Promise<Project[]>
  get: (id: string, signal?: AbortSignal) => Promise<Project | null>
}

export interface RepairService {
  get: (id: string, signal?: AbortSignal) => Promise<RepairSession | null>
}

/** Static demonstration adapter; a future real preview needs an isolated-origin contract. */
export interface SamplePreviewService {
  getDocument: (
    version: PreviewVersion,
    options?: { signal?: AbortSignal; scenario?: PreviewScenario },
  ) => Promise<PreviewDocument>
}
