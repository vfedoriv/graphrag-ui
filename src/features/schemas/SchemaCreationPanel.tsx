import type { UseMutationResult } from '@tanstack/react-query'
import type { CreateSchemaRequest, Schema } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'

export function SchemaCreationPanel({
  schemaJson,
  selectedKnowledgeBaseId,
  onSchemaJsonChange,
  createMutation,
}: {
  schemaJson: string
  selectedKnowledgeBaseId: string | null
  onSchemaJsonChange: (schemaJson: string) => void
  createMutation: UseMutationResult<Schema, Error, { payload: CreateSchemaRequest; knowledgeBaseId?: string | null }>
}) {
  return (
    <div className='stack' data-testid='schema-creation-section'>
      <FieldLabel htmlFor='create-schema-json'>Schema JSON content</FieldLabel>
      <SchemaJsonEditor
        id='create-schema-json'
        label='Schema JSON content'
        value={schemaJson}
        onChange={onSchemaJsonChange}
        placeholder='Paste JSON schema content'
        disabled={createMutation.isPending}
      />
      <Button
        type='button'
        variant='primary'
        isPending={createMutation.isPending}
        pendingText='Creating...'
        onClick={() =>
          createMutation.mutate({
            knowledgeBaseId: selectedKnowledgeBaseId,
            payload: {
              content: schemaJson,
              sourceType: 'PREDEFINED',
              ...(selectedKnowledgeBaseId ? { knowledgeBaseId: selectedKnowledgeBaseId } : {}),
            },
          })
        }
      >
        Create
      </Button>
      {createMutation.error && <Alert title='Create failed' message={(createMutation.error as Error).message} />}
    </div>
  )
}
