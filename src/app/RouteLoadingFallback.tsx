export function RouteLoadingFallback() {
  return (
    <div className='inline-state' role='status' aria-label='Loading route'>
      <h3>Loading page</h3>
      <p>Preparing the selected workspace view.</p>
    </div>
  )
}
