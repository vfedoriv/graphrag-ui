import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isPending?: boolean
  pendingText?: string
}

export function Button({ className, isPending = false, pendingText = 'Working...', disabled, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || isPending}
      aria-busy={isPending}
      className={cn(
        'rounded-md border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-semibold text-white',
        'transition duration-150 ease-out',
        'hover:brightness-110 hover:shadow-sm',
        'active:translate-y-px active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none',
        className,
      )}
      {...props}
    >
      {isPending ? pendingText : children}
    </button>
  )
}
