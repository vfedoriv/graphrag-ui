import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-amber-300 focus:ring-2',
        className,
      )}
      {...props}
    />
  )
}
