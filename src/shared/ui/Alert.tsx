import { cn } from '../lib/cn'

export function Alert({
  title,
  message,
  tone = 'error',
}: {
  title: string
  message: string
  tone?: 'error' | 'info' | 'success'
}) {
  const toneClass = {
    error: 'border-rose-300 bg-rose-50 text-rose-800',
    info: 'border-sky-300 bg-sky-50 text-sky-900',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  }[tone]

  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        toneClass,
      )}
    >
      <strong className='block'>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
