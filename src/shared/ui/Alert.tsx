import { cn } from '../lib/cn'

export function Alert({
  title,
  message,
  tone = 'error',
}: {
  title: string
  message: string
  tone?: 'error' | 'info'
}) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        tone === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-sky-300 bg-sky-50 text-sky-900',
      )}
    >
      <strong className='block'>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
