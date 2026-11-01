import { Link } from 'react-router'
import { ArrowLeft, Compass } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="page-container not-found-page">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={Compass}
        eyebrow="404 / OFF THE BEATEN PATH"
        title="Let's get you back on track."
        description="This page or repair session isn't available in the local preview."
      >
        <Button asChild>
          <Link to="/app">
            <ArrowLeft size={15} />
            Back to overview
          </Link>
        </Button>
      </EmptyState>
    </div>
  )
}
