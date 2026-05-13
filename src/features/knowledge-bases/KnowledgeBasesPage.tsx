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
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FieldLabel } from '../../shared/ui/FieldLabel'
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
    try {
      const created = await createMutation.mutateAsync(values)
      setSelectedKnowledgeBaseId(created.id)
      form.reset()
    } catch {
      // surfaced via createMutation.error
    }
  })

  const createSection = (
    <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4' data-testid='knowledge-bases-create-section'>
      <h2 className='text-base font-semibold text-slate-900'>Create knowledge base</h2>
      <form onSubmit={onSubmit} className='grid gap-2 md:grid-cols-[1fr_1fr_auto]'>
        <div className='space-y-1'>
          <FieldLabel htmlFor='knowledge-base-id'>Knowledge base ID</FieldLabel>
          <Input id='knowledge-base-id' placeholder='id (kb-demo)' {...form.register('id')} />
        </div>
        <div className='space-y-1'>
          <FieldLabel htmlFor='knowledge-base-name'>Knowledge base name</FieldLabel>
          <Input id='knowledge-base-name' placeholder='name' {...form.register('name')} />
        </div>
        <Button type='submit' disabled={createMutation.isPending}>Create</Button>
      </form>
      {createMutation.error && <Alert title='Create failed' message={(createMutation.error as Error).message} />}
    </div>
  )

  const listSection = isLoading ? (
    <p className='text-sm text-slate-600'>Loading knowledge bases...</p>
  ) : data.length === 0 ? (
    <EmptyState title='No Knowledge Bases' body='Create one to begin GraphRAG workflows.' />
  ) : (
    <Table
      headers={['Selected', 'ID', 'Name', 'Active schema', 'Actions']}
      rowKeys={data.map((kb) => kb.id)}
      rows={data.map((kb) => [
        kb.id === selectedKnowledgeBaseId ? 'Yes' : 'No',
        kb.id,
        <Input
          defaultValue={kb.name}
          onBlur={(e) => {
            if (e.target.value !== kb.name) {
              updateMutation.mutate({ id: kb.id, payload: { name: e.target.value } })
            }
          }}
          aria-label={`name-${kb.id}`}
        />,
        kb.activeSchemaId ?? '-',
        <div className='flex gap-2'>
          <Button type='button' onClick={() => setSelectedKnowledgeBaseId(kb.id)} className='bg-slate-700'>Use</Button>
          <Button
            type='button'
            className='bg-rose-700'
            onClick={async () => {
              try {
                await deleteMutation.mutateAsync(kb.id)
                if (selectedKnowledgeBaseId === kb.id) {
                  setSelectedKnowledgeBaseId(null)
                }
              } catch {
                // surfaced via deleteMutation.error
              }
            }}
          >
            Delete
          </Button>
        </div>,
      ])}
    />
  )

  return (
    <ControllerPage
      title='Knowledge Bases'
      topSectionTitle='Knowledge bases'
      topSection={
        <div className='space-y-4'>
          {createSection}
          {updateMutation.error && <Alert title='Update failed' message={(updateMutation.error as Error).message} />}
          {deleteMutation.error && <Alert title='Delete failed' message={(deleteMutation.error as Error).message} />}
          {listSection}
        </div>
      }
      testId='knowledge-bases-controller-page'
    />
  )
}
