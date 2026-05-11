import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateKnowledgeBaseMutation,
  useDeleteKnowledgeBaseMutation,
  useKnowledgeBasesQuery,
  useUpdateKnowledgeBaseMutation,
} from '../../api/knowledgeBases'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Input } from '../../shared/ui/Input'
import { Table } from '../../shared/ui/Table'

const schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export function KnowledgeBasesPage() {
  const { data = [], isLoading } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const createMutation = useCreateKnowledgeBaseMutation()
  const updateMutation = useUpdateKnowledgeBaseMutation()
  const deleteMutation = useDeleteKnowledgeBaseMutation()

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { id: '', name: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    const created = await createMutation.mutateAsync(values)
    setSelectedKnowledgeBaseId(created.id)
    form.reset()
  })

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Knowledge Bases</h1>
      <form onSubmit={onSubmit} className='grid gap-2 rounded-md border border-slate-300 bg-white p-4 md:grid-cols-[1fr_1fr_auto]'>
        <Input placeholder='id (kb-demo)' {...form.register('id')} />
        <Input placeholder='name' {...form.register('name')} />
        <Button type='submit' disabled={createMutation.isPending}>Create</Button>
      </form>
      {createMutation.error && <Alert title='Create failed' message={(createMutation.error as Error).message} />}
      {isLoading ? (
        <p className='text-sm text-slate-600'>Loading knowledge bases...</p>
      ) : data.length === 0 ? (
        <EmptyState title='No Knowledge Bases' body='Create one to begin GraphRAG workflows.' />
      ) : (
        <Table
          headers={['Selected', 'ID', 'Name', 'Active schema', 'Actions']}
          rows={data.map((kb) => [
            kb.id === selectedKnowledgeBaseId ? 'Yes' : 'No',
            kb.id,
            <Input
              defaultValue={kb.name}
              onBlur={(e) => updateMutation.mutate({ id: kb.id, payload: { name: e.target.value } })}
              aria-label={`name-${kb.id}`}
            />,
            kb.activeSchemaId ?? '-',
            <div className='flex gap-2'>
              <Button type='button' onClick={() => setSelectedKnowledgeBaseId(kb.id)} className='bg-slate-700'>Use</Button>
              <Button
                type='button'
                className='bg-rose-700'
                onClick={async () => {
                  await deleteMutation.mutateAsync(kb.id)
                  if (selectedKnowledgeBaseId === kb.id) {
                    setSelectedKnowledgeBaseId(null)
                  }
                }}
              >
                Delete
              </Button>
            </div>,
          ])}
        />
      )}
    </section>
  )
}
