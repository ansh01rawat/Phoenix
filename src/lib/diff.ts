import type { CodeChange } from '@/types/repair'
export function lineDiff(original: string, modified: string): CodeChange[] {
  const a = original.split('\n'),
    b = modified.split('\n')
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      matrix[i][j] =
        a[i] === b[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1])
  const rows: CodeChange[] = []
  let i = 0,
    j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      rows.push({ kind: 'equal', text: a[i], oldLine: ++i, newLine: ++j })
    } else if (i < a.length && (j === b.length || matrix[i + 1][j] >= matrix[i][j + 1])) {
      rows.push({ kind: 'removed', text: a[i], oldLine: ++i })
    } else {
      rows.push({ kind: 'added', text: b[j], newLine: ++j })
    }
  }
  return rows
}
