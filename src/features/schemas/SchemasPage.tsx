import { useState } from 'react'
import {
  useActivateSchemaMutation,
  useCreateSchemaMutation,
  useSchemasByKnowledgeBaseQuery,
  useValidateSchemaMutation,
} from '../../api/schemas'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { type Schema } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { type EndpointTab, EndpointTabs } from '../../shared/ui/EndpointTabs'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'
import { SCHEMA_BUILDER_DRAFT_STORAGE_KEY } from '../schema-builder/schemaBuilderStorage'
import { SchemaCreationPanel } from './SchemaCreationPanel'
import { SchemaExampleGenerationWorkflow, SchemaJsonGenerationWorkflow } from './SchemaGenerationWorkflows'
import { SchemaValidationPanel } from './SchemaValidationPanel'
import { formatSchemaSourceTypeLabel, isSupportedSchemaSourceType, navigateToSchemaBuilder } from './schemaUtils'
import { useSchemaRowActions } from './useSchemaRowActions'

export function SchemasPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()

  return <SchemasPageContent key={selectedKnowledgeBaseId ?? 'none'} selectedKnowledgeBaseId={selectedKnowledgeBaseId} />
}

function SchemasPageContent({ selectedKnowledgeBaseId }: { selectedKnowledgeBaseId: string | null }) {
  const { data = [] } = useSchemasByKnowledgeBaseQuery(selectedKnowledgeBaseId)
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const activeKnowledgeBase = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId)
  const [schemaJson, setSchemaJson] = useState('')
  const [generatedJsonOutput, setGeneratedJsonOutput] = useState('')
  const [generatedJsonFromFileOutput, setGeneratedJsonFromFileOutput] = useState('')
  const [isGeneratePending, setIsGeneratePending] = useState(false)
  const createMutation = useCreateSchemaMutation()
  const activateMutation = useActivateSchemaMutation()
  const validateMutation = useValidateSchemaMutation()
  const schemaRowActions = useSchemaRowActions({ selectedKnowledgeBaseId })
  const {
    schemaDetailsLabel,
    schemaDetailsOutput,
    editingSchema,
    updateDraft,
    updateSuccess,
    deleteTargetLabel,
    deleteSuccess,
  } = schemaRowActions.state
  const { getSchemaMutation, getSchemaForUpdateMutation, updateMutation, deleteMutation } = schemaRowActions.mutations
  const isAnyPending =
    createMutation.isPending ||
    activateMutation.isPending ||
    getSchemaMutation.isPending ||
    getSchemaForUpdateMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    validateMutation.isPending ||
    isGeneratePending

  const unsupportedSourceTypeSchemas = data.filter((schema) => !isSupportedSchemaSourceType(schema.sourceType))
  const activeDeleteSchemaId = deleteMutation.variables?.schemaId
  const activeActivateSchemaId = activateMutation.variables?.schemaId

  const openSchemaInBuilder = (schema: Schema) => {
    navigateToSchemaBuilder(`/schema-builder?schemaId=${encodeURIComponent(schema.id)}`)
  }

  const openDraftInBuilder = (json: string) => {
    sessionStorage.setItem(SCHEMA_BUILDER_DRAFT_STORAGE_KEY, json)
    navigateToSchemaBuilder('/schema-builder?draft=session')
  }

  const topSection = (
    <>
      {data.length === 0 ? (
        <EmptyState title='No Schemas for selected knowledge base' body='Create or generate one, then activate it for the selected knowledge base.' />
      ) : (
        <Table
          headers={['Name', 'Version', 'Source Type', 'Status', 'Actions']}
          rowKeys={data.map((schema) => schema.id)}
          rowClassNames={data.map((schema) => (schema.status === 'ACTIVE' ? 'is-selected' : ''))}
          rows={data.map((schema) => [
            <div>
              <strong>{schema.name}</strong>
            </div>,
            String(schema.version),
            <StatusBadge label={formatSchemaSourceTypeLabel(schema.sourceType)} tone={isSupportedSchemaSourceType(schema.sourceType) ? 'neutral' : 'warning'} />,
            <StatusBadge label={schema.status} tone={schema.status === 'ACTIVE' ? 'success' : 'neutral'} />,
            <div className='row-actions schema-row-actions'>
              <Button
                type='button'
                variant='ghost'
                className='table-action-button schema-action-button'
                disabled={!selectedKnowledgeBaseId || schema.status === 'ACTIVE'}
                isPending={activateMutation.isPending && activeActivateSchemaId === schema.id}
                pendingText='Activating...'
                onClick={() => selectedKnowledgeBaseId && activateMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, schemaId: schema.id })}
              >
                {schema.status === 'ACTIVE' ? 'Active' : 'Activate'}
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='table-action-button schema-action-button'
                isPending={getSchemaMutation.isPending && getSchemaMutation.variables === schema.id}
                pendingText='Loading...'
                onClick={() => {
                  void schemaRowActions.loadSchemaDetails(schema)
                }}
              >
                Details
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='table-action-button schema-action-button'
                onClick={() => openSchemaInBuilder(schema)}
              >
                Builder
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='table-action-button schema-action-button'
                isPending={getSchemaForUpdateMutation.isPending && getSchemaForUpdateMutation.variables === schema.id}
                pendingText='Loading...'
                onClick={() => {
                  void schemaRowActions.openUpdateEditor(schema)
                }}
              >
                Update
              </Button>
              <Button
                type='button'
                variant='danger'
                className='table-action-button schema-action-button'
                isPending={deleteMutation.isPending && activeDeleteSchemaId === schema.id}
                pendingText='Deleting...'
                onClick={() => {
                  void schemaRowActions.deleteSchema(schema)
                }}
              >
                Delete
              </Button>
            </div>,
          ])}
        />
      )}
      {(schemaDetailsOutput || getSchemaMutation.error || getSchemaMutation.isPending) && (
        <div className='flow-card'>
          <div>
            <h3>Schema details</h3>
            {schemaDetailsLabel && <p>{schemaDetailsLabel}</p>}
          </div>
          <FieldLabel htmlFor='schema-row-details-output'>Schema details JSON</FieldLabel>
          <Textarea
            id='schema-row-details-output'
            rows={8}
            value={schemaDetailsOutput}
            onChange={(e) => schemaRowActions.setSchemaDetailsOutput(e.target.value)}
            placeholder='Schema details response'
          />
          {getSchemaMutation.error && <Alert title='Get schema failed' message={(getSchemaMutation.error as Error).message} />}
        </div>
      )}
      <RuntimeContextSummary
        knowledgeBaseId={selectedKnowledgeBaseId}
        settingHints={['schema', 'generation', 'example']}
        title='Schema generation context'
      />
      {editingSchema && (
        <div className='flow-card'>
          <div>
            <h3>Update schema</h3>
            <p>
              {editingSchema.name} v{editingSchema.version} ({editingSchema.id})
            </p>
          </div>
          <FieldLabel htmlFor='update-schema-json'>Schema JSON content</FieldLabel>
          <SchemaJsonEditor
            id='update-schema-json'
            label='Schema JSON content'
            value={updateDraft}
            onChange={schemaRowActions.setUpdateDraft}
            placeholder='Schema JSON content'
            disabled={updateMutation.isPending}
          />
          <div className='toolbar'>
            <Button type='button' variant='primary' isPending={updateMutation.isPending} pendingText='Saving...' onClick={() => void schemaRowActions.saveUpdate()}>
              Save
            </Button>
            <Button type='button' disabled={updateMutation.isPending} onClick={schemaRowActions.cancelUpdate}>
              Cancel
            </Button>
          </div>
          {updateSuccess && <StatusBadge label={updateSuccess} tone='success' />}
          {updateMutation.error && <Alert title='Update failed' message={(updateMutation.error as Error).message} />}
        </div>
      )}
      {unsupportedSourceTypeSchemas.length > 0 && (
        <Alert
          title='Unsupported schema source type'
          message={`Some schemas use unsupported source type values: ${unsupportedSourceTypeSchemas.map((schema) => `${schema.id} (${schema.sourceType})`).join(', ')}`}
        />
      )}
      {!selectedKnowledgeBaseId && <Alert title='No knowledge base selected' message='Activation requires selecting a knowledge base in the header or KB page.' tone='info' />}
      {activateMutation.error && <Alert title='Activate failed' message={(activateMutation.error as Error).message} />}
      {getSchemaForUpdateMutation.error && <Alert title='Load schema for update failed' message={(getSchemaForUpdateMutation.error as Error).message} />}
      {deleteSuccess && <StatusBadge label={deleteSuccess} tone='success' />}
      {deleteMutation.error && <Alert title='Delete failed' message={`Schema ${deleteTargetLabel}: ${(deleteMutation.error as Error).message}`} />}
      {isAnyPending ? <ProgressBanner message='Waiting for schema workflow response...' /> : null}
    </>
  )

  const workflowTabs: EndpointTab[] = [
    {
      id: 'schema-example-generation',
      label: 'Schema example generation',
      content: <SchemaExampleGenerationWorkflow onPendingChange={setIsGeneratePending} />,
    },
    {
      id: 'schema-json-generation',
      label: 'Schema JSON generation',
      content: (
        <SchemaJsonGenerationWorkflow
          textOutput={generatedJsonOutput}
          fileOutput={generatedJsonFromFileOutput}
          onTextOutputReady={(json) => {
            setGeneratedJsonOutput(json)
            setSchemaJson(json)
          }}
          onFileOutputReady={(json) => {
            setGeneratedJsonFromFileOutput(json)
            setSchemaJson(json)
          }}
          onOpenInBuilder={openDraftInBuilder}
          onPendingChange={setIsGeneratePending}
        />
      ),
    },
    {
      id: 'schema-validation',
      label: 'Schema validation',
      content: (
        <SchemaValidationPanel
          schemaJson={schemaJson}
          onSchemaJsonChange={setSchemaJson}
          validateMutation={validateMutation}
        />
      ),
    },
    {
      id: 'schema-creation',
      label: 'Schema creation',
      content: (
        <SchemaCreationPanel
          schemaJson={schemaJson}
          selectedKnowledgeBaseId={selectedKnowledgeBaseId}
          onSchemaJsonChange={setSchemaJson}
          createMutation={createMutation}
        />
      ),
    },
  ]

  return (
    <ControllerPage
      title='Schemas'
      eyebrow='Schema control plane'
      description='Manage the active schema for the selected workspace, then generate examples, draft schema JSON, validate payloads, or create a schema without losing scope.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Workspace', value: selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'Schemas', value: String(data.length) },
            { label: 'Active schema', value: data.find((schema) => schema.status === 'ACTIVE')?.name ?? 'None active', tone: data.some((schema) => schema.status === 'ACTIVE') ? 'success' : 'warning' },
            { label: 'Active AI profile', value: activeKnowledgeBase?.activeAiProfileId ?? 'None assigned', tone: activeKnowledgeBase?.activeAiProfileId ? 'success' : 'warning' },
          ]}
        />
      }
      topSectionTitle='Schemas list'
      topSectionDescription='Readable metadata first; lifecycle controls stay attached to each schema row.'
      topSectionStatus={<StatusBadge label={data.some((schema) => schema.status === 'ACTIVE') ? 'Active schema present' : 'No active schema'} tone={data.some((schema) => schema.status === 'ACTIVE') ? 'success' : 'warning'} />}
      topSection={topSection}
      tabs={
        <div className='stack'>
          <OperationSpine
            className='schema-spine'
            ariaLabel='Schema operating model'
            items={[
              { eyebrow: 'Active schema', title: data.find((schema) => schema.status === 'ACTIVE')?.name ?? 'None active', body: 'Used by document and query workflows.' },
              { eyebrow: 'Schema register', title: `${data.length} schemas`, body: 'View, edit, activate, or delete workspace-scoped schemas.' },
              { eyebrow: 'Draft policy', title: 'Editable before create', body: 'Generated and validated JSON remains reviewable before persistence.' },
              { eyebrow: 'Input sources', title: 'Text or file', body: 'Generation flows support typed examples and multipart upload.' },
            ]}
          />
          <EndpointTabs tabs={workflowTabs} testId='schemas-purpose-tabs' disableTabSwitch={isAnyPending} keepPanelsMounted />
        </div>
      }
      tabsTitle='Purpose workflow console'
      tabsDescription='Four schema paths stay separate so generated examples do not look like persisted schemas.'
      testId='schemas-controller-page'
    />
  )
}
