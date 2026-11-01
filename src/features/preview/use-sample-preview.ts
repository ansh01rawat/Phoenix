import { useCallback, useEffect, useRef, useState } from 'react'
import { mockPreviewService } from '@/services/mock/previewService'
import type { PreviewScenario, PreviewVersion } from '@/types/repair'

type PreviewState = {
  requestId: number
  html: string | null
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

export function useSamplePreview(
  version: PreviewVersion,
  scenario: PreviewScenario,
  enabled: boolean,
) {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<PreviewState>({
    requestId: 0,
    html: null,
    status: 'loading',
    error: null,
  })
  const sequence = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const requestId = ++sequence.current
    const controller = new AbortController()
    setState({ requestId, html: null, status: 'loading', error: null })
    const deadline = setTimeout(() => {
      setState((current) =>
        current.requestId === requestId && current.status === 'loading'
          ? {
              ...current,
              html: null,
              status: 'error',
              error: 'The sample preview did not finish loading. Retry the preview to continue.',
            }
          : current,
      )
      controller.abort()
    }, 6000)
    void mockPreviewService
      .getDocument(version, { signal: controller.signal, scenario })
      .then((document) => {
        if (!controller.signal.aborted)
          setState((current) =>
            current.requestId === requestId && current.status === 'loading'
              ? { ...current, html: document.html }
              : current,
          )
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState((current) =>
            current.requestId === requestId
              ? {
                  ...current,
                  html: null,
                  status: 'error',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'The sample preview could not be loaded. Try again.',
                }
              : current,
          )
      })
    return () => {
      clearTimeout(deadline)
      controller.abort()
    }
  }, [version, scenario, revision, enabled])

  const loaded = useCallback(
    (requestId: number) =>
      setState((current) =>
        current.requestId === requestId && current.html !== null && current.status === 'loading'
          ? { ...current, status: 'ready', error: null }
          : current,
      ),
    [],
  )
  const failed = useCallback(
    (requestId: number) =>
      setState((current) =>
        current.requestId === requestId
          ? {
              ...current,
              status: 'error',
              error: 'The sample frame could not be displayed. Retry the preview to continue.',
            }
          : current,
      ),
    [],
  )
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  return { ...state, loaded, failed, refresh }
}
