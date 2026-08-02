import { useEffect } from 'react'
import { Bot, Database, FileClock, FileText, GitBranch, House, Settings, Spline, Waypoints, Scissors } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useKnowledgeBasesQuery } from '../api/knowledgeBases'
import { useSelectedKnowledgeBase } from '../shared/state/useSelectedKnowledgeBase'
import { cn } from '../shared/lib/cn'
import { StatusBadge } from '../shared/ui/StatusBadge'
import type { ThemePreference } from '../shared/state/theme'
import { useTheme } from '../shared/state/useTheme'

const navItems = [
  { to: '/', label: 'Dashboard', icon: House },
  { to: '/knowledge-bases', label: 'Knowledge Bases', icon: Database },
  { to: '/schemas', label: 'Schemas', icon: Spline },
  { to: '/schema-builder', label: 'Schema Builder', icon: GitBranch },
  { to: '/schema-drafts', label: 'Schema Drafts', icon: FileClock },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/chunking', label: 'Chunking', icon: Scissors },
  { to: '/queries', label: 'Queries', icon: Waypoints },
  { to: '/ai-providers', label: 'AI Providers', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const { data: knowledgeBases = [], isLoading, isSuccess } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { preference, resolvedTheme, setPreference } = useTheme()
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
    <div className='app-shell'>
      <aside className='sidebar'>
        <NavLink className='brand' to='/'>
          <span className='brand-mark'>G</span>
          <span>GraphRAG UI</span>
        </NavLink>

        <nav className='nav' aria-label='Primary'>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => cn('nav-link', isActive && 'active')}
            >
              <item.icon size={16} aria-hidden='true' />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className='sidebar-context'>
          <label className='appearance-control'>
            <span className='eyebrow'>Appearance</span>
            <select
              aria-label='Appearance'
              value={preference}
              onChange={(event) => setPreference(event.target.value as ThemePreference)}
            >
              <option value='light'>Light</option>
              <option value='system'>System</option>
              <option value='dark'>Dark</option>
            </select>
            <small>Using {resolvedTheme} theme</small>
          </label>

          <div className='workspace-switcher'>
            <label>
              <span className='eyebrow'>Workspace</span>
              <select
                aria-label='knowledge-base-selector'
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
            </label>
            <div className='workspace-meta'>
              <strong>{activeKb ? `${activeKb.name} (${activeKb.id})` : 'None selected'}</strong>
              <small>{activeKb?.activeSchemaId ? `Active schema: ${activeKb.activeSchemaId}` : 'No active schema selected'}</small>
            </div>
            <StatusBadge
              label={isLoading ? 'Loading workspace list' : knowledgeBases.length > 0 ? 'Backend data available' : 'No API data yet'}
              tone={knowledgeBases.length > 0 ? 'success' : 'neutral'}
            />
          </div>
        </div>
      </aside>

      <main className='workspace'>
        <Outlet />
      </main>
    </div>
  )
}
