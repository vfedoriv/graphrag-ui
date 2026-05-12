import type { ReactNode } from 'react'

type OutputPreviewProps = {
  label: string
  children: ReactNode
}

export function OutputPreview({ label, children }: OutputPreviewProps) {
  return (
    <div className='min-w-0 space-y-1'>
      <p className='text-sm font-medium text-slate-700'>{label}</p>
      <pre
        data-testid='output-preview-content'
        className='block max-h-72 w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto whitespace-pre rounded-md border border-slate-300 bg-white p-3 text-xs'
      >
        {children}
      </pre>
    </div>
  )
}
