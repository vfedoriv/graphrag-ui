import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { MetricGrid, OperationSpine, Notice, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'

const apiBasePath = '/api/v1'
const devProxyTarget = import.meta.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

export function SettingsPage() {
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null

  return (
    <ControllerPage
      title='Settings'
      eyebrow='Runtime control plane'
      description='Review the API gateway, workspace scope, and request behavior used by every backend controller page.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Selected workspace', value: activeKb?.name ?? selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'API base', value: apiBasePath },
          ]}
        />
      }
      topSectionTitle='Runtime configuration'
      topSectionDescription='These values describe how the UI reaches the GraphRAG backend; they are not editable in the browser.'
      topSectionStatus={<StatusBadge label='Frontend-only settings' tone='neutral' />}
      topSection={
        <div className='stack-lg'>
          <OperationSpine
            ariaLabel='Settings status summary'
            items={[
              { eyebrow: 'Gateway', title: apiBasePath, body: 'All frontend API calls are same-origin and routed through this base path.' },
              { eyebrow: 'Development proxy', title: devProxyTarget, body: 'Vite proxies /api traffic to this target during local development.' },
              { eyebrow: 'Scope', title: activeKb?.name ?? 'None selected', body: activeKb?.id ?? 'Select a knowledge base to scope controller requests.' },
              { eyebrow: 'Runtime guard', title: 'Duplicate requests blocked', body: 'Pending buttons disable the launched action until the request settles.' },
            ]}
          />

          <section className='grid two'>
            <article className='flow-card'>
              <div className='panel-head compact'>
                <div>
                  <p className='eyebrow'>Backend gateway</p>
                  <h2>API connection</h2>
                </div>
                <StatusBadge label='Same-origin proxy' tone='success' />
              </div>
              <div className='settings-form'>
                <label>
                  Base path
                  <input value={apiBasePath} aria-label='Backend API base path' readOnly />
                </label>
                <label>
                  Development target
                  <input value={devProxyTarget} aria-label='Development API proxy target' readOnly />
                </label>
                <label>
                  Production runtime
                  <input value='GRAPHRAG_API_URL via nginx template' aria-label='Production API runtime variable' readOnly />
                </label>
              </div>
              <Notice title='Runtime API configuration'>
                Frontend calls /api/v1. Development expects VITE_API_PROXY_TARGET, and production nginx expects GRAPHRAG_API_URL.
              </Notice>
            </article>

            <article className='flow-card'>
              <div className='panel-head compact'>
                <div>
                  <p className='eyebrow'>Workspace defaults</p>
                  <h2>Active scope</h2>
                </div>
                <StatusBadge label={activeKb ? 'Selected' : 'No selection'} tone={activeKb ? 'success' : 'warning'} />
              </div>
              <div className='schema-list'>
                <div>
                  <span className='eyebrow'>Workspace ID</span>
                  <strong>{activeKb?.id ?? 'None selected'}</strong>
                  <small>{activeKb?.name ?? 'Choose a knowledge base from the sidebar or Knowledge Bases page.'}</small>
                </div>
                <div>
                  <span className='eyebrow'>Active schema</span>
                  <strong>{activeKb?.activeSchemaId ?? 'None active'}</strong>
                  <small>Used by document processing and query defaults where the backend requires it.</small>
                </div>
              </div>
            </article>
          </section>

          <section className='grid two'>
            <article className='flow-card'>
              <div className='panel-head compact'>
                <div>
                  <p className='eyebrow'>Request safeguards</p>
                  <h2>Controller behavior</h2>
                </div>
              </div>
              <div className='settings-list'>
                <label className='check-row'><input type='checkbox' checked readOnly /> Lock duplicate actions while a request is pending</label>
                <label className='check-row'><input type='checkbox' checked readOnly /> Keep draft input after validation failures</label>
                <label className='check-row'><input type='checkbox' checked readOnly /> Show inline API errors on the source page</label>
              </div>
            </article>

            <article className='flow-card'>
              <div className='panel-head compact'>
                <div>
                  <p className='eyebrow'>Implementation target</p>
                  <h2>Frontend stack</h2>
                </div>
              </div>
              <div className='schema-list'>
                <div><strong>React 19 + React Router</strong><small>Route-based controller pages with shared workspace state.</small></div>
                <div><strong>TanStack Query</strong><small>Query and mutation lifecycle state for backend endpoints.</small></div>
                <div><strong>Vite + nginx</strong><small>Development and production proxy behavior stay configuration-driven.</small></div>
              </div>
            </article>
          </section>

          <section className='flow-card'>
            <div className='panel-head compact'>
              <div>
                <p className='eyebrow'>Maintenance</p>
                <h2>Shared operations</h2>
              </div>
            </div>
            <MetricGrid
              items={[
                { title: 'Mutation locks', body: 'Only the launched action is disabled while pending.' },
                { title: 'Error locality', body: 'Failure state stays close to the workflow that caused it.' },
                { title: 'Workspace scope', body: 'Selection scopes schemas, documents, and queries.' },
              ]}
            />
          </section>
        </div>
      }
      testId='settings-controller-page'
    />
  )
}
