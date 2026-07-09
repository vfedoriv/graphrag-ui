import type { UseMutationResult } from '@tanstack/react-query'
import type { SchemaValidationResponse, ValidateSchemaRequest } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'
import { StatusBadge } from '../../shared/ui/StatusBadge'

export function SchemaValidationPanel({
  schemaJson,
  onSchemaJsonChange,
  validateMutation,
}: {
  schemaJson: string
  onSchemaJsonChange: (schemaJson: string) => void
  validateMutation: UseMutationResult<SchemaValidationResponse, Error, ValidateSchemaRequest>
}) {
  return (
    <div className='stack' data-testid='schema-validation-section'>
      <FieldLabel htmlFor='validate-schema-json-input'>Schema JSON content</FieldLabel>
      <SchemaJsonEditor
        id='validate-schema-json-input'
        label='Schema JSON content'
        value={schemaJson}
        onChange={onSchemaJsonChange}
        placeholder='Paste JSON schema content'
        disabled={validateMutation.isPending}
      />
      <Button
        type='button'
        variant='primary'
        isPending={validateMutation.isPending}
        pendingText='Validating...'
        onClick={() => validateMutation.mutate({ content: schemaJson })}
      >
        Validate schema JSON
      </Button>
      {validateMutation.error && <Alert title='Validate failed' message={(validateMutation.error as Error).message} />}
      {validateMutation.data && (validateMutation.data.errors.length === 0 ? <StatusBadge label='Schema is valid.' tone='success' /> : <Alert title='Schema validation errors' message={validateMutation.data.errors.join('; ')} />)}
    </div>
  )
}
