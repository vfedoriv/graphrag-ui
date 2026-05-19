import { useEffect, useMemo, useState } from 'react'
import { JsonEditor, type JsonValue } from '@visual-json/react'
import { Textarea } from './Textarea'
import { cn } from '../lib/cn'

type SchemaJsonEditorProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number
}

const EMPTY_SCHEMA_OBJECT = '{}'
type ViewMode = 'tree' | 'raw'

export function SchemaJsonEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 260,
}: SchemaJsonEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const normalizedValue = value.trim() === '' ? EMPTY_SCHEMA_OBJECT : value

  useEffect(() => {
    if (value.trim() === '') {
      onChange(EMPTY_SCHEMA_OBJECT)
    }
  }, [onChange, value])

  const parsed = useMemo(() => parseJson(normalizedValue), [normalizedValue])
  const activeViewMode = parsed.ok ? viewMode : 'raw'

  const handleDataChange = (data: JsonValue) => {
    onChange(JSON.stringify(data, null, 2))
  }

  const selectTreeView = () => {
    if (parsed.ok) {
      setViewMode('tree')
    }
  }

  return (
    <div className='space-y-2' data-testid={`${id}-schema-json-editor`}>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs font-medium uppercase tracking-wide text-slate-600'>Expected format: JSON</p>
        <div className='inline-flex w-fit rounded-md border border-slate-300 bg-white p-1 shadow-sm' aria-label={`${label} view style`}>
          <button
            type='button'
            aria-pressed={activeViewMode === 'tree'}
            disabled={disabled || !parsed.ok}
            onClick={selectTreeView}
            className={viewButtonClass(activeViewMode === 'tree')}
          >
            Tree View
          </button>
          <button
            type='button'
            aria-pressed={activeViewMode === 'raw'}
            disabled={disabled}
            onClick={() => setViewMode('raw')}
            className={viewButtonClass(activeViewMode === 'raw')}
          >
            Raw View
          </button>
        </div>
      </div>
      {activeViewMode === 'tree' && parsed.ok ? (
        <div
          className='rounded-md border border-slate-300 bg-white p-3 text-sm shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-200'
          aria-label={label}
          aria-disabled={disabled}
          role='group'
          style={{ minHeight }}
        >
          <JsonEditor
            value={parsed.data}
            onChange={handleDataChange}
            readOnly={disabled}
            height='100%'
            width='100%'
            sidebarOpen
            treeShowValues
            treeShowCounts
            editorShowCounts
          />
        </div>
      ) : (
        <div className='space-y-2'>
          <Textarea
            id={id}
            aria-label={label}
            rows={8}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className='font-mono text-xs'
            style={{ minHeight }}
          />
          <p className={cn('text-xs', parsed.ok ? 'text-slate-500' : 'text-rose-700')}>
            {parsed.ok
              ? 'Raw View supports direct JSON edits and clipboard paste. Switch back to Tree View after editing valid JSON.'
              : 'Cannot render invalid JSON as Tree View. Fix the JSON in Raw View to continue structured editing.'}
          </p>
        </div>
      )}
    </div>
  )
}

function parseJson(value: string): { ok: true, data: JsonValue } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(value) as JsonValue }
  } catch {
    return { ok: false }
  }
}

function viewButtonClass(isActive: boolean) {
  return cn(
    'rounded px-3 py-1.5 text-xs font-semibold transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
    'disabled:pointer-events-none disabled:opacity-50',
    isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
  )
}
