import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isPending?: boolean
  pendingText?: string
  variant?: 'standard' | 'primary' | 'danger' | 'ghost'
}

export function Button({
  className,
  isPending = false,
  pendingText = 'Working...',
  disabled,
  children,
  variant = 'standard',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isPending}
      aria-busy={isPending}
      data-pending={isPending ? 'true' : undefined}
      className={cn(
        'button',
        variant !== 'standard' && variant,
        className,
      )}
      {...props}
    >
      {isPending ? pendingText : children}
    </button>
  )
}
