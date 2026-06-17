import type { ReactNode } from 'react'

type OutputPreviewProps = {
  label: string
  children: ReactNode
  format?: 'plain' | 'json'
}

export function OutputPreview({ label, children, format = 'plain' }: OutputPreviewProps) {
  return (
    <div className='stack'>
      <div>
        <p className='field-label'>{label}</p>
        {format !== 'plain' ? <p className='eyebrow'>Format: {format.toUpperCase()}</p> : null}
      </div>
      <pre
        data-testid='output-preview-content'
        className='output'
      >
        {children}
      </pre>
    </div>
  )
}
