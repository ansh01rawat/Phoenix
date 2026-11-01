export function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="loading-state">
      <span className="loading-indicator" aria-hidden="true" />
      <p>Opening your workspace…</p>
    </div>
  )
}
