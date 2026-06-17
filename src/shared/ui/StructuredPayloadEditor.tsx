import type { TextareaHTMLAttributes } from 'react'
import { Button } from './Button'
import { Textarea } from './Textarea'

type StructuredPayloadFormat = 'json'

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
      const formatted = JSON.stringify(JSON.parse(value) as unknown, null, 2)
      onChange(formatted)
      onErrorChange?.(null)
    } catch {
      onErrorChange?.(`Cannot format invalid ${formatLabel} payload.`)
    }
  }

  return (
    <div className='stack'>
      <div className='split-stack'>
        <p className='eyebrow'>Expected format: {formatLabel}</p>
        <Button type='button' variant='ghost' onClick={formatValue}>
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
        className='mono'
      />
      {error ? <p className='text-xs text-red-700'>{error}</p> : null}
    </div>
  )
}
