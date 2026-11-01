import { useRef, type ComponentProps, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export function DialogContent({
  children,
  className,
  side,
  closeLabel = 'Close dialog',
  closeDisabled = false,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  children: ReactNode
  side?: 'left' | 'right'
  closeLabel?: string
  closeDisabled?: boolean
}) {
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content
        className={cn('dialog-content', side && `dialog-sheet dialog-sheet-${side}`, className)}
        {...props}
        onOpenAutoFocus={(event) => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
          onOpenAutoFocus?.(event)
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
          // A drawer can open the guide or command menu. Let the new modal own focus.
          if (document.querySelector('[role="dialog"][data-state="open"]')) return
          const opener = returnFocus.current
          const fallback = document.querySelector<HTMLElement>('.mobile-menu')
          const target =
            opener?.isConnected && opener.getClientRects().length
              ? opener
              : fallback?.getClientRects().length
                ? fallback
                : document.getElementById('main-content')
          target?.focus({ preventScroll: true })
        }}
      >
        {children}
        <DialogPrimitive.Close
          className="button button-ghost button-icon dialog-close"
          aria-label={closeLabel}
          disabled={closeDisabled}
        >
          <X size={17} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
