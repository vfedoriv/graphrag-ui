import { useEffect, useMemo } from 'react'
import { JsonEditor, githubLightTheme, type JsonData } from 'json-edit-react'
import { Textarea } from './Textarea'

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

export function SchemaJsonEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 260,
}: SchemaJsonEditorProps) {
  const normalizedValue = value.trim() === '' ? EMPTY_SCHEMA_OBJECT : value

  useEffect(() => {
    if (value.trim() === '') {
      onChange(EMPTY_SCHEMA_OBJECT)
    }
  }, [onChange, value])

  const parsed = useMemo(() => parseJson(normalizedValue), [normalizedValue])

  const handleDataChange = (data: JsonData) => {
    onChange(JSON.stringify(data, null, 2))
  }

  return (
    <div className='space-y-2' data-testid={`${id}-schema-json-editor`}>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs font-medium uppercase tracking-wide text-slate-600'>Expected format: JSON</p>
        <p className='text-xs text-slate-500'>Structured editor</p>
      </div>
      {parsed.ok ? (
        <div
          className='rounded-md border border-slate-300 bg-white p-3 text-sm shadow-sm focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-200'
          aria-label={label}
          aria-disabled={disabled}
          role='group'
          style={{ minHeight }}
        >
          <JsonEditor
            id={id}
            data={parsed.data}
            setData={handleDataChange}
            rootName='schema'
            theme={githubLightTheme}
            restrictDrag={disabled ? true : false}
            restrictEdit={disabled}
            restrictAdd={disabled}
            restrictDelete={disabled}
            showIconTooltips
            showCollectionCount='when-closed'
            showStringQuotes
            defaultValue=''
            minWidth='100%'
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
          />
          <p className='text-xs text-rose-700'>Cannot render invalid JSON as structured data. Fix the JSON to continue structured editing.</p>
        </div>
      )}
    </div>
  )
}

function parseJson(value: string): { ok: true, data: JsonData } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(value) as JsonData }
  } catch {
    return { ok: false }
  }
}
