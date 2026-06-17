export function ProgressBanner({ message }: { message: string }) {
  return (
    <div
      role='status'
      aria-live='polite'
      className='inline-state'
    >
      <span className='font-medium'>In progress:</span> {message}
    </div>
  )
}
