import { useId, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { CornerDownLeft, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { commandDestinations } from '@/config/navigation'
import { useUiStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

export function CommandMenu() {
  const { commandOpen, setCommandOpen } = useUiStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const listId = useId()
  const filtered = commandDestinations.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase().trim()),
  )
  const close = () => {
    setCommandOpen(false)
    setQuery('')
    setSelected(0)
  }
  const go = (to: string) => {
    close()
    navigate(to)
  }
  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected((index) =>
        filtered.length
          ? (index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % filtered.length
          : 0,
      )
    }
    if (event.key === 'Enter' && filtered[selected]) {
      event.preventDefault()
      go(filtered[selected].to)
    }
  }
  return (
    <Dialog open={commandOpen} onOpenChange={(open) => (open ? setCommandOpen(true) : close())}>
      <DialogContent className="command-dialog" closeLabel="Close page navigation">
        <DialogTitle className="sr-only">Jump to a page</DialogTitle>
        <DialogDescription className="sr-only">
          Search the Phoenix pages. Use the arrow keys to choose a destination and Enter to open it.
        </DialogDescription>
        <div className="command-search">
          <Search size={19} />
          <input
            aria-label="Search pages"
            placeholder="Where would you like to go?"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={filtered[selected] ? `${listId}-${selected}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelected(0)
            }}
            onKeyDown={handleKey}
            autoComplete="off"
          />
        </div>
        <div className="command-results">
          <p className="eyebrow">Navigate to</p>
          <div role="listbox" id={listId} aria-label="Pages">
            {filtered.map(({ label, icon: Icon, to }, index) => (
              <button
                type="button"
                role="option"
                id={`${listId}-${index}`}
                aria-selected={index === selected}
                key={to}
                className={cn('command-result', index === selected && 'command-result-selected')}
                onMouseMove={() => setSelected(index)}
                onClick={() => go(to)}
              >
                <Icon size={17} />
                <span>{label}</span>
                <CornerDownLeft size={13} className="ml-auto" />
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="command-no-results" role="status">
              No pages found. Try “workspace” or “projects”.
            </p>
          )}
        </div>
        <div className="command-footer">
          <span>
            <kbd>
              <ArrowUp size={11} />
            </kbd>
            <kbd>
              <ArrowDown size={11} />
            </kbd>{' '}
            to navigate
          </span>
          <span>
            <kbd>↵</kbd> to open <kbd>esc</kbd> to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
