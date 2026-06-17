import { cn } from '../lib/cn'

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}) {
  return <span className={cn('status', tone)}>{label}</span>
}
