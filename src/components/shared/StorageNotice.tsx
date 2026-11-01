import { useSyncExternalStore } from 'react'
import { AlertTriangle } from 'lucide-react'
import { browserStorageStatus } from '@/store/browser-storage'

export function StorageNotice() {
  const status = useSyncExternalStore(
    browserStorageStatus.subscribe,
    browserStorageStatus.getSnapshot,
  )
  if (status === 'available') return null
  return (
    <div className="storage-notice" role="status">
      <AlertTriangle size={15} aria-hidden="true" />
      <p>
        {status === 'session-only' ? (
          <>
            <strong>Session-only mode.</strong> Browser storage is unavailable. You can continue
            this demo, but new changes will be lost on refresh.
          </>
        ) : (
          <>
            <strong>Saved demo data recovered.</strong> Some saved entries could not be restored.
            Valid records remain available.
          </>
        )}{' '}
        Original website files are untouched.
      </p>
    </div>
  )
}
