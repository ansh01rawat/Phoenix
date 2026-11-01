import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { browserStorage, reportStorageRecovery } from './browser-storage'
import { isRecord } from './saved-state'

interface UiState {
  sidebarCollapsed: boolean
  reduceMotion: boolean
  commandOpen: boolean
  guideOpen: boolean
  toggleSidebar: () => void
  setReduceMotion: (value: boolean) => void
  setCommandOpen: (value: boolean) => void
  setGuideOpen: (value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      reduceMotion: false,
      commandOpen: false,
      guideOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setReduceMotion: (value) => set({ reduceMotion: value }),
      setCommandOpen: (value) => set({ commandOpen: value }),
      setGuideOpen: (value) => set({ guideOpen: value }),
    }),
    {
      name: 'phoenix-ui-v1',
      storage: createJSONStorage(() => browserStorage),
      partialize: ({ sidebarCollapsed, reduceMotion }) => ({ sidebarCollapsed, reduceMotion }),
      merge: (persisted, current) => {
        if (!isRecord(persisted)) return current
        if (
          Object.keys(persisted).some(
            (key) => !['sidebarCollapsed', 'reduceMotion'].includes(key),
          ) ||
          (persisted.sidebarCollapsed !== undefined &&
            typeof persisted.sidebarCollapsed !== 'boolean') ||
          (persisted.reduceMotion !== undefined && typeof persisted.reduceMotion !== 'boolean')
        )
          reportStorageRecovery()
        return {
          ...current,
          sidebarCollapsed:
            typeof persisted.sidebarCollapsed === 'boolean'
              ? persisted.sidebarCollapsed
              : current.sidebarCollapsed,
          reduceMotion:
            typeof persisted.reduceMotion === 'boolean'
              ? persisted.reduceMotion
              : current.reduceMotion,
        }
      },
    },
  ),
)
