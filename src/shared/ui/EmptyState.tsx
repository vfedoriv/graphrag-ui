export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className='inline-state'>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  )
}
