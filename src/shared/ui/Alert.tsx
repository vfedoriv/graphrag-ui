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
    error: 'danger',
    info: '',
    success: 'success',
  }[tone]

  return (
    <div className={cn('notice', toneClass)}>
      <strong className='block'>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
