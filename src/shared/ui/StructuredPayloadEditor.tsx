import type { TextareaHTMLAttributes } from 'react'
import YAML from 'yaml'
import { Button } from './Button'
import { Textarea } from './Textarea'

type StructuredPayloadFormat = 'json' | 'yaml'

type StructuredPayloadEditorProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  format: StructuredPayloadFormat
  value: string
  onChange: (value: string) => void
  error?: string | null
  onErrorChange?: (value: string | null) => void
}

export function StructuredPayloadEditor({
  format,
  value,
  onChange,
  error,
  onErrorChange,
  ...props
}: StructuredPayloadEditorProps) {
  const formatLabel = format.toUpperCase()

  const formatValue = () => {
    try {
      const formatted =
        format === 'json'
          ? JSON.stringify(JSON.parse(value) as unknown, null, 2)
          : YAML.stringify(YAML.parse(value))
      onChange(formatted)
      onErrorChange?.(null)
    } catch {
      onErrorChange?.(`Cannot format invalid ${formatLabel} payload.`)
    }
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs font-medium uppercase tracking-wide text-slate-600'>Expected format: {formatLabel}</p>
        <Button type='button' className='bg-slate-700 px-2 py-1 text-xs' onClick={formatValue}>
          Format {formatLabel}
        </Button>
      </div>
      <Textarea
        {...props}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          if (error) {
            onErrorChange?.(null)
          }
        }}
        className='font-mono text-xs'
      />
      {error ? <p className='text-xs text-rose-700'>{error}</p> : null}
    </div>
  )
}
