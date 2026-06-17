import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateKnowledgeBaseMutation,
  useDeleteKnowledgeBaseMutation,
  useKnowledgeBasesQuery,
  useUpdateKnowledgeBaseMutation,
} from '../../api/knowledgeBases'
import { useSchemasQuery } from '../../api/schemas'
import type { KnowledgeBase, Schema } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { Input } from '../../shared/ui/Input'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'

const schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export function KnowledgeBasesPage() {
  const { data = [], isLoading } = useKnowledgeBasesQuery()
  const { data: schemas = [] } = useSchemasQuery()
  const { selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const [editingKnowledgeBaseId, setEditingKnowledgeBaseId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const createMutation = useCreateKnowledgeBaseMutation()
  const updateMutation = useUpdateKnowledgeBaseMutation()
  const deleteMutation = useDeleteKnowledgeBaseMutation()
  const isAnyPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

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

  const startRename = (kb: KnowledgeBase) => {
    setEditingKnowledgeBaseId(kb.id)
    setEditName(kb.name)
  }

  const cancelRename = () => {
    setEditingKnowledgeBaseId(null)
    setEditName('')
  }

  const saveRename = async (kb: KnowledgeBase) => {
    const nextName = editName.trim()
    if (!nextName || nextName === kb.name) {
      cancelRename()
      return
    }

    try {
      await updateMutation.mutateAsync({ id: kb.id, payload: { name: nextName } })
      cancelRename()
    } catch {
      // surfaced via updateMutation.error
    }
  }

  const deleteKnowledgeBase = async (kb: KnowledgeBase) => {
    const confirmed = window.confirm(
      `Delete knowledge base "${kb.name}"? All data related to this knowledge base will be deleted.`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteMutation.mutateAsync(kb.id)
      if (selectedKnowledgeBaseId === kb.id) {
        setSelectedKnowledgeBaseId(null)
      }
    } catch {
      // surfaced via deleteMutation.error
    }
  }

  const createSection = (
    <div className='stack' data-testid='knowledge-bases-create-section'>
      <div>
        <span className='eyebrow'>Create</span>
        <h3>Create knowledge base</h3>
      </div>
      <form onSubmit={onSubmit} className='form-grid'>
        <div className='stack'>
          <FieldLabel htmlFor='knowledge-base-id'>Knowledge base ID</FieldLabel>
          <Input id='knowledge-base-id' placeholder='id (kb-demo)' {...form.register('id')} />
        </div>
        <div className='stack'>
          <FieldLabel htmlFor='knowledge-base-name'>Knowledge base name</FieldLabel>
          <Input id='knowledge-base-name' placeholder='name' {...form.register('name')} />
        </div>
        <Button type='submit' variant='primary' isPending={createMutation.isPending} pendingText='Creating...'>Create</Button>
      </form>
      {createMutation.error && <Alert title='Create failed' message={(createMutation.error as Error).message} />}
    </div>
  )

  const listSection = isLoading ? (
    <p>Loading knowledge bases...</p>
  ) : data.length === 0 ? (
    <EmptyState title='No Knowledge Bases' body='Create one to begin GraphRAG workflows.' />
  ) : (
    <Table
      headers={['Selected', 'ID', 'Name', 'Active schema', 'Actions']}
      rowKeys={data.map((kb) => kb.id)}
      rowClassNames={data.map((kb) => (kb.id === selectedKnowledgeBaseId ? 'is-selected' : ''))}
      rows={data.map((kb) => {
        const isEditing = editingKnowledgeBaseId === kb.id
        const isUpdatingRow = updateMutation.isPending && updateMutation.variables?.id === kb.id

        return [
          <StatusBadge label={kb.id === selectedKnowledgeBaseId ? 'Selected' : 'Available'} tone={kb.id === selectedKnowledgeBaseId ? 'success' : 'neutral'} />,
          <code>{kb.id}</code>,
          isEditing ? (
            <div className='row-edit-control'>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                aria-label={`Rename ${kb.name}`}
                disabled={isUpdatingRow}
              />
              <div className='row-actions'>
                <Button
                  type='button'
                  variant='primary'
                  className='table-action-button'
                  isPending={isUpdatingRow}
                  pendingText='Saving...'
                  onClick={() => void saveRename(kb)}
                >
                  Save
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  className='table-action-button'
                  disabled={isUpdatingRow}
                  onClick={cancelRename}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <span>{kb.name}</span>
          ),
          <StatusBadge label={getActiveSchemaName(kb, schemas)} tone={kb.activeSchemaId ? 'success' : 'warning'} />,
          <div className='row-actions'>
            <Button
              type='button'
              variant='ghost'
              className='table-action-button'
              disabled={kb.id === selectedKnowledgeBaseId}
              onClick={() => setSelectedKnowledgeBaseId(kb.id)}
            >
              {kb.id === selectedKnowledgeBaseId ? 'Current' : 'Use'}
            </Button>
            {!isEditing ? (
              <Button
                type='button'
                variant='ghost'
                className='table-action-button'
                onClick={() => startRename(kb)}
              >
                Edit
              </Button>
            ) : null}
            <Button
              type='button'
              variant='danger'
              className='table-action-button'
              isPending={deleteMutation.isPending && deleteMutation.variables === kb.id}
              pendingText='Deleting...'
              onClick={() => void deleteKnowledgeBase(kb)}
            >
              Delete
            </Button>
          </div>,
        ]
      })}
    />
  )

  return (
    <ControllerPage
      title='Knowledge Bases'
      eyebrow='Controller page'
      description='Create, rename, select, and delete knowledge bases from one workspace.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Selected', value: selectedKnowledgeBaseId ?? 'None' },
            { label: 'Rows', value: String(data.length) },
          ]}
        />
      }
      topSectionTitle='Knowledge base workspace'
      topSectionDescription='Inline creation remains visible above stable row actions.'
      topSectionStatus={<StatusBadge label={isLoading ? 'Loading' : `${data.length} rows`} tone='neutral' />}
      topSection={
        <div className='stack-lg'>
          {isAnyPending ? <ProgressBanner message='Waiting for knowledge base update...' /> : null}
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

function getActiveSchemaName(knowledgeBase: KnowledgeBase, schemas: Schema[]) {
  if (!knowledgeBase.activeSchemaId) {
    return 'None active'
  }

  const schema = schemas.find(
    (schema) => schema.id === knowledgeBase.activeSchemaId || `${schema.name} v${schema.version}` === knowledgeBase.activeSchemaId,
  )

  return schema?.name ?? knowledgeBase.activeSchemaId
}
