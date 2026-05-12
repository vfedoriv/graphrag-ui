import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type FieldLabelProps = {
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function FieldLabel({ htmlFor, children, className }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn('block text-sm font-medium text-slate-700', className)}>
      {children}
    </label>
  )
}
