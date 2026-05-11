export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className='rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600'>
      <h3 className='mb-1 text-base font-semibold text-slate-900'>{title}</h3>
      <p>{body}</p>
    </div>
  )
}
