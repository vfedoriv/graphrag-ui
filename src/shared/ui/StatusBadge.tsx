import { cn } from '../lib/cn'

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
        tone === 'success' && 'bg-emerald-100 text-emerald-700',
        tone === 'warning' && 'bg-amber-100 text-amber-700',
        tone === 'error' && 'bg-rose-100 text-rose-700',
        tone === 'neutral' && 'bg-slate-200 text-slate-700',
      )}
    >
      {label}
    </span>
  )
}
