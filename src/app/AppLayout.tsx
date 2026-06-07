import { useEffect } from 'react'
import { Database, FileText, House, Settings, Spline, Waypoints } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useKnowledgeBasesQuery } from '../api/knowledgeBases'
import { useSelectedKnowledgeBase } from '../shared/state/useSelectedKnowledgeBase'
import { cn } from '../shared/lib/cn'
import { StatusBadge } from '../shared/ui/StatusBadge'

const navItems = [
  { to: '/', label: 'Dashboard', icon: House },
  { to: '/knowledge-bases', label: 'Knowledge Bases', icon: Database },
  { to: '/schemas', label: 'Schemas', icon: Spline },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/queries', label: 'Queries', icon: Waypoints },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const { data: knowledgeBases = [], isSuccess } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null

  useEffect(() => {
    if (!isSuccess || !selectedKnowledgeBaseId) {
      return
    }
    if (!knowledgeBases.some((kb) => kb.id === selectedKnowledgeBaseId)) {
      setSelectedKnowledgeBaseId(null)
    }
  }, [isSuccess, knowledgeBases, selectedKnowledgeBaseId, setSelectedKnowledgeBaseId])

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_10%_10%,#e8f5e9_0,#f8fafc_40%,#f1f5f9_100%)] text-slate-900'>
      <div className='grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-[250px_minmax(0,1fr)] lg:p-6'>
        <aside className='w-full rounded-xl border border-slate-300 bg-white p-4 md:w-[250px]'>
          <p className='mb-4 font-serif text-xl font-bold tracking-tight text-slate-900'>GraphRAG UI</p>
          <nav className='space-y-2'>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-slate-100',
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className='min-w-0 space-y-4'>
          <header className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-4'>
            <div className='space-y-1'>
              <p className='text-sm text-slate-500'>Active knowledge base</p>
              <p className='font-semibold'>{activeKb ? `${activeKb.name} (${activeKb.id})` : 'None selected'}</p>
            </div>
            <div className='flex items-center gap-2'>
              <select
                aria-label='knowledge-base-selector'
                className='rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
                value={selectedKnowledgeBaseId ?? ''}
                onChange={(e) => setSelectedKnowledgeBaseId(e.target.value || null)}
              >
                <option value=''>No selection</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name} ({kb.id})
                  </option>
                ))}
              </select>
              <StatusBadge label={knowledgeBases.length > 0 ? 'Backend reachable via API flows' : 'No API data yet'} tone={knowledgeBases.length > 0 ? 'success' : 'neutral'} />
            </div>
          </header>
          <section className='min-w-0 rounded-xl border border-slate-300 bg-white p-4'>
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  )
}
