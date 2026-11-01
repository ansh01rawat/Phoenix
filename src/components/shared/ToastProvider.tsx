import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Info, X } from 'lucide-react'
import { ToastContext } from '@/hooks/use-toast'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const announce = useCallback((value: string) => {
    clearTimeout(timer.current)
    setMessage(value)
    timer.current = setTimeout(() => setMessage(''), 4000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <ToastContext.Provider value={announce}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {message && (
          <div className="toast">
            <Info size={16} />
            <span>{message}</span>
            <button
              className="button button-ghost button-icon"
              aria-label="Dismiss notification"
              onClick={() => setMessage('')}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
