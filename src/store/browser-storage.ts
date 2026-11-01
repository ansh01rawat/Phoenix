import type { StateStorage } from 'zustand/middleware'

type StorageStatus = 'available' | 'recovered' | 'session-only'
let status: StorageStatus = 'available'
const listeners = new Set<() => void>()
const memory = new Map<string, string>()
const unavailable = new Set<string>()

function publish(next: StorageStatus) {
  if (status === next || status === 'session-only') return
  status = next
  listeners.forEach((listener) => listener())
}

export const browserStorageStatus = {
  getSnapshot: () => status,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export const reportStorageRecovery = () => publish('recovered')

/** Persistence is optional: unavailable browser storage must never interrupt a demo action. */
export const browserStorage: StateStorage = {
  getItem(name) {
    if (unavailable.has(name)) return memory.get(name) ?? null
    let value: string | null
    try {
      value = localStorage.getItem(name)
    } catch {
      unavailable.add(name)
      publish('session-only')
      return memory.get(name) ?? null
    }
    if (value === null) return null
    try {
      const payload: unknown = JSON.parse(value)
      if (
        !payload ||
        typeof payload !== 'object' ||
        !('state' in payload) ||
        !payload.state ||
        typeof payload.state !== 'object' ||
        Array.isArray(payload.state)
      )
        throw new Error('Invalid saved state')
      memory.set(name, value)
      return value
    } catch {
      reportStorageRecovery()
      return null
    }
  },
  setItem(name, value) {
    memory.set(name, value)
    if (unavailable.has(name)) return
    try {
      localStorage.setItem(name, value)
    } catch {
      unavailable.add(name)
      publish('session-only')
    }
  },
  removeItem(name) {
    memory.delete(name)
    if (unavailable.has(name)) return
    try {
      localStorage.removeItem(name)
    } catch {
      unavailable.add(name)
      publish('session-only')
    }
  },
}
