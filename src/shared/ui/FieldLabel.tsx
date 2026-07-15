import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type FieldLabelProps = {
  htmlFor?: string
  children: ReactNode
  className?: string
  label?: ReactNode
}

export function FieldLabel({ htmlFor, children, className, label }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn('field-label', className)}>
      {label ? <span>{label}</span> : null}
      {children}
    </label>
  )
}
