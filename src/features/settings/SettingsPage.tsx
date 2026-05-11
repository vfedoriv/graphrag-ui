import { Alert } from '../../shared/ui/Alert'

export function SettingsPage() {
  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Settings</h1>
      <Alert
        tone='info'
        title='Runtime API configuration'
        message='Frontend calls /api/v1. Development expects VITE_API_PROXY_TARGET (default http://localhost:8080). Production nginx expects GRAPHRAG_API_URL.'
      />
    </section>
  )
}
