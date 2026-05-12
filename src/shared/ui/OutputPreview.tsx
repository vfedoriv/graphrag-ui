import type { ReactNode } from 'react'

type OutputPreviewProps = {
  label: string
  children: ReactNode
}

export function OutputPreview({ label, children }: OutputPreviewProps) {
  return (
    <div className='space-y-1'>
      <p className='text-sm font-medium text-slate-700'>{label}</p>
      <pre className='max-h-72 overflow-auto rounded-md border border-slate-300 bg-white p-3 text-xs'>{children}</pre>
    </div>
  )
}
