export function EmptyState({ title, body, description }: { title: string; body?: string; description?: string }) {
  return (
    <div className='inline-state'>
      <h3>{title}</h3>
      <p>{body ?? description}</p>
    </div>
  )
}
