import { Link } from 'react-router-dom'
import { useDocumentsQuery } from '../../api/documents'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useSchemasByKnowledgeBaseQuery, useSchemasQuery } from '../../api/schemas'
import type { KnowledgeBase, Schema } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ActionGrid, OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'

export function DashboardPage() {
  const { data: knowledgeBases = [], isLoading } = useKnowledgeBasesQuery()
  const { data: allSchemas = [] } = useSchemasQuery()
  const { selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const active = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null
  const { data: schemas = [] } = useSchemasByKnowledgeBaseQuery(active?.id ?? null)
  const { data: documents = [] } = useDocumentsQuery(active?.id ?? null)
  const activeSchema = active?.activeSchemaId
    ? schemas.find((schema) => schema.id === active.activeSchemaId || `${schema.name} v${schema.version}` === active.activeSchemaId)
    : null
  const activeSchemaLabel = getActiveSchemaName(active, schemas, allSchemas)

  return (
    <section className='stack-lg' data-testid='dashboard-controller-page'>
      <header className='page-header'>
        <div>
          <p className='eyebrow'>Dashboard</p>
          <h1>Knowledge bases and schemas</h1>
          <p className='lede'>Choose the active workspace, check whether its schema and corpus are ready, then jump into the controller page that owns the next workflow.</p>
          <div className='workspace-strip'>
            <WorkspaceStrip
              items={[
                { label: 'Workspace', value: active?.name ?? 'None selected' },
                { label: 'Active schema', value: activeSchemaLabel, tone: active?.activeSchemaId ? 'success' : 'warning' },
                { label: 'Documents', value: active ? String(documents.length) : 'Unavailable' },
              ]}
            />
          </div>
        </div>
        <div className='header-actions'>
          <Link className='button primary' to='/knowledge-bases'>Manage knowledge bases</Link>
          <Link className='button' to='/schemas'>Open schema workbench</Link>
        </div>
      </header>

      <OperationSpine
        ariaLabel='Dashboard readiness'
        items={[
          {
            eyebrow: 'Active scope',
            title: active?.name ?? 'None selected',
            body: active ? `${active.id} is the current request context.` : 'Select a knowledge base to scope controller requests.',
          },
          {
            eyebrow: 'Schema gate',
            title: activeSchema ? `${activeSchema.name} v${activeSchema.version}` : active?.activeSchemaId ?? 'None active',
            body: active?.activeSchemaId ? 'Extraction and validation use this active schema.' : 'Schema-gated actions should start in the schema workbench.',
          },
          {
            eyebrow: 'Corpus',
            title: active ? `${documents.length} documents` : 'Unavailable',
            body: active ? 'Documents available for processing and retrieval.' : 'Select a workspace to load document counts.',
          },
          {
            eyebrow: 'Gateway',
            title: knowledgeBases.length > 0 ? 'Ready' : 'Waiting',
            body: knowledgeBases.length > 0 ? 'Backend data is available to controller actions.' : 'Knowledge-base data has not loaded yet.',
          },
        ]}
      />

      <section className='panel'>
        <div className='panel-head'>
          <div>
            <h2>Knowledge bases</h2>
            <p>Use this as the working set selector. The selected row controls schemas, documents, and query defaults.</p>
          </div>
          <div className='panel-actions'>
            <StatusBadge label={isLoading ? 'Loading' : `${knowledgeBases.length} rows`} tone='neutral' />
            <Link className='button ghost' to='/knowledge-bases'>Create new</Link>
          </div>
        </div>
        {knowledgeBases.length === 0 ? (
          <EmptyState title='No Knowledge Bases' body='Create one to begin schema, document, and query workflows.' />
        ) : (
          <Table
            ariaLabel='Knowledge base list'
            headers={['Name', 'ID', 'Selected', 'Active schema', 'Actions']}
            rowKeys={knowledgeBases.map((kb) => kb.id)}
            rowClassNames={knowledgeBases.map((kb) => (kb.id === selectedKnowledgeBaseId ? 'is-selected' : ''))}
            rows={knowledgeBases.map((kb) => [
              <div>
                <strong>{kb.name}</strong>
                <small>Created {new Date(kb.createdAt).toLocaleDateString()}</small>
              </div>,
              <code>{kb.id}</code>,
              <StatusBadge label={kb.id === selectedKnowledgeBaseId ? 'Selected' : 'Available'} tone={kb.id === selectedKnowledgeBaseId ? 'success' : 'neutral'} />,
              <StatusBadge label={getActiveSchemaName(kb, schemas, allSchemas)} tone={kb.activeSchemaId ? 'success' : 'warning'} />,
              <Button
                type='button'
                variant='ghost'
                disabled={kb.id === selectedKnowledgeBaseId}
                aria-label={kb.id === selectedKnowledgeBaseId ? `${kb.name} is the current workspace` : `Use ${kb.name} workspace`}
                onClick={() => setSelectedKnowledgeBaseId(kb.id)}
              >
                {kb.id === selectedKnowledgeBaseId ? 'Current' : 'Use'}
              </Button>,
            ])}
          />
        )}
      </section>

      <section className='grid two'>
        <article className='panel'>
          <div className='panel-head compact'>
            <div>
              <h2>Active workspace next steps</h2>
              <p>Actions inherit {active?.id ?? 'the selected knowledge base'}.</p>
            </div>
          </div>
          <ActionGrid
            items={[
              { to: '/schemas', title: 'Schema workbench', description: 'Generate, validate, create, activate' },
              { to: '/documents', title: 'Document intake', description: 'Upload, process, inspect chunks' },
              { to: '/queries', title: 'Query console', description: 'Ask, generate Cypher, hybrid search' },
            ]}
          />
        </article>
        <article className='panel'>
          <div className='panel-head compact'>
            <div>
              <h2>Schema coverage</h2>
              <p>Live schema state for the selected workspace.</p>
            </div>
          </div>
          <div className='schema-list'>
            <div>
              <StatusBadge label={active?.activeSchemaId ? 'Active' : 'Review'} tone={active?.activeSchemaId ? 'success' : 'warning'} />
              <strong>{activeSchema ? `${activeSchema.name} v${activeSchema.version}` : active?.activeSchemaId ?? 'No active schema'}</strong>
              <small>{active?.activeSchemaId ? 'Current extraction contract' : 'Activate a schema before processing new files.'}</small>
            </div>
            <div>
              <StatusBadge label='Available' tone='neutral' />
              <strong>Associated schemas</strong>
              <small>{active ? `${schemas.length} schemas` : 'Select a workspace to load schemas'}</small>
            </div>
          </div>
        </article>
      </section>
    </section>
  )
}

function getActiveSchemaName(knowledgeBase: KnowledgeBase | null, selectedSchemas: Schema[], allSchemas: Schema[]) {
  if (!knowledgeBase?.activeSchemaId) {
    return 'None active'
  }

  const schema = [...selectedSchemas, ...allSchemas].find(
    (schema) => schema.id === knowledgeBase.activeSchemaId || `${schema.name} v${schema.version}` === knowledgeBase.activeSchemaId,
  )

  return schema?.name ?? knowledgeBase.activeSchemaId
}
