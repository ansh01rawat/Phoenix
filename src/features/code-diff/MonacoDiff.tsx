import { useEffect, useRef } from 'react'
import { DiffEditor, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api.js'
import 'monaco-editor/languages/definitions/typescript/register.js'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import type { ModifiedFile } from '@/types/repair'

;(
  globalThis as typeof globalThis & { MonacoEnvironment: { getWorker: () => Worker } }
).MonacoEnvironment = { getWorker: () => new EditorWorker() }
loader.config({ monaco })
monaco.editor.defineTheme('phoenix-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '9295A3' },
    { token: 'keyword', foreground: 'B9A2EB' },
    { token: 'string', foreground: 'C6B797' },
  ],
  colors: {
    'editor.background': '#16171b',
    'editor.foreground': '#c9cbd6',
    'editorLineNumber.foreground': '#858492',
    'diffEditor.insertedTextBackground': '#8b83f633',
    'diffEditor.insertedLineBackground': '#8b83f610',
    'diffEditor.removedTextBackground': '#e36b7530',
    'diffEditor.removedLineBackground': '#e36b7510',
    'editorGutter.background': '#16171b',
    'editor.selectionBackground': '#8b83f630',
  },
})

function labelComparison(editor: monaco.editor.IStandaloneDiffEditor, path: string) {
  // Label the actual sub-editors as well as the diff construction options.
  editor.getOriginalEditor().updateOptions({ ariaLabel: `Original source for ${path}` })
  editor.getModifiedEditor().updateOptions({ ariaLabel: `Proposed demo repair for ${path}` })
}

export default function MonacoDiff({ file }: { file: ModifiedFile }) {
  const comparison = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  useEffect(() => {
    if (comparison.current) labelComparison(comparison.current, file.path)
  }, [file.path])
  return (
    <DiffEditor
      onMount={(editor) => {
        comparison.current = editor
        labelComparison(editor, file.path)
      }}
      keepCurrentOriginalModel
      keepCurrentModifiedModel
      height="440px"
      original={file.original}
      modified={file.modified}
      originalModelPath={`original/${file.path}`}
      modifiedModelPath={`proposed/${file.path}`}
      language="typescript"
      theme="phoenix-dark"
      loading={
        <div className="editor-loading" role="status">
          Loading the code comparison…
        </div>
      }
      options={{
        originalAriaLabel: `Original source for ${file.path}`,
        modifiedAriaLabel: `Proposed demo repair for ${file.path}`,
        readOnly: true,
        originalEditable: false,
        automaticLayout: true,
        renderSideBySide: true,
        renderSideBySideInlineBreakpoint: 0,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 24,
        fontFamily: 'Geist Mono Variable, monospace',
        scrollBeyondLastLine: false,
        padding: { top: 14 },
        renderOverviewRuler: false,
        overviewRulerLanes: 0,
        lineNumbersMinChars: 3,
        folding: false,
        renderIndicators: true,
        contextmenu: false,
        stickyScroll: { enabled: false },
      }}
    />
  )
}
