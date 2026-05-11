import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { EmptyState } from '../../shared/ui/EmptyState'
import { StatusBadge } from '../../shared/ui/StatusBadge'

export function DashboardPage() {
  const { data: knowledgeBases } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const active = knowledgeBases?.find((kb) => kb.id === selectedKnowledgeBaseId)

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Dashboard</h1>
      {!active ? (
        <EmptyState title='No Active Knowledge Base' body='Select a knowledge base to start schema, document, and query workflows.' />
      ) : (
        <div className='rounded-md border border-slate-300 bg-white p-4'>
          <h2 className='mb-2 text-lg font-semibold text-slate-900'>{active.name}</h2>
          <p className='mb-3 text-sm text-slate-700'>Knowledge base id: {active.id}</p>
          <StatusBadge label={active.activeSchemaId ? `Active schema: ${active.activeSchemaId}` : 'No active schema'} tone={active.activeSchemaId ? 'success' : 'warning'} />
        </div>
      )}
    </section>
  )
}
