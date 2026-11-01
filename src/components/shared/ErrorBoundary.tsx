import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Phoenix interface error', error, info.componentStack)
  }
  render() {
    if (this.state.hasError)
      return (
        <main className="fatal-error">
          <TriangleAlert size={28} />
          <h1>Something interrupted your workspace.</h1>
          <p>Reload Phoenix to try again. No source files have been changed.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Reload workspace
          </button>
        </main>
      )
    return this.props.children
  }
}
