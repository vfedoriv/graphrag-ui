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
    <div className='stack' data-testid={`${id}-schema-json-editor`}>
      <div className='split-stack'>
        <p className='eyebrow'>Expected format: JSON</p>
        <div className='view-toggle' aria-label={`${label} view style`}>
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
          className='panel'
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
        <div className='stack'>
          <Textarea
            id={id}
            aria-label={label}
            rows={8}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className='mono'
            style={{ minHeight }}
          />
          <p className={cn('text-xs', parsed.ok ? 'muted' : 'text-red-700')}>
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
    'tab',
    isActive && 'active',
  )
}
