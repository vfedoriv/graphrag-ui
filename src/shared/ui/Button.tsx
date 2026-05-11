import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'rounded-md border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
