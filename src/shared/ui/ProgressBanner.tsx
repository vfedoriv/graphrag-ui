export function ProgressBanner({ message }: { message: string }) {
  return (
    <div
      role='status'
      aria-live='polite'
      className='rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-900'
    >
      <span className='font-medium'>In progress:</span> {message}
    </div>
  )
}
