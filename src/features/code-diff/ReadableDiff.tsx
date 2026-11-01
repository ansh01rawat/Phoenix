import { lineDiff } from '@/lib/diff'
import type { ModifiedFile } from '@/types/repair'
export function ReadableDiff({ file }: { file: ModifiedFile }) {
  return (
    <div
      className="readable-diff"
      role="region"
      aria-label={`Unified code comparison for ${file.path}`}
      tabIndex={0}
    >
      {lineDiff(file.original, file.modified).map((row, index) => (
        <div className={`diff-line diff-${row.kind}`} key={index}>
          <span className="diff-line-number" aria-hidden="true">
            {row.newLine ?? row.oldLine}
          </span>
          <span
            className="diff-sign"
            aria-label={
              row.kind === 'added' ? 'Added' : row.kind === 'removed' ? 'Removed' : undefined
            }
          >
            {row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : ' '}
          </span>
          <code>{row.text || ' '}</code>
        </div>
      ))}
    </div>
  )
}
