import type { ReactNode } from 'react'

type OutputPreviewProps = {
  label: string
  children: ReactNode
  format?: 'plain' | 'json' | 'yaml'
}

export function OutputPreview({ label, children, format = 'plain' }: OutputPreviewProps) {
  return (
    <div className='min-w-0 space-y-1'>
      <p className='text-sm font-medium text-slate-700'>{label}</p>
      {format !== 'plain' ? <p className='text-xs uppercase tracking-wide text-slate-500'>Format: {format.toUpperCase()}</p> : null}
      <pre
        data-testid='output-preview-content'
        className='block max-h-72 w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto whitespace-pre rounded-md border border-slate-300 bg-white p-3 font-mono text-xs'
      >
        {children}
      </pre>
    </div>
  )
}
