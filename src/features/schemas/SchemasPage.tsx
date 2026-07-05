import { useEffect, useState } from 'react'
import {
  useActivateSchemaMutation,
  useCreateSchemaMutation,
  useDeleteSchemaMutation,
  useGenerateSchemaExampleFromFileMutation,
  useGenerateSchemaExampleMutation,
  useGenerateSchemaJsonFromFileMutation,
  useGenerateSchemaJsonMutation,
  useGetSchemaMutation,
  useSchemasByKnowledgeBaseQuery,
  useUpdateSchemaMutation,
  useValidateSchemaMutation,
} from '../../api/schemas'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { type Schema, type SchemaDetails, type SchemaGenerationWarning, type SchemaSourceType } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { type EndpointTab, EndpointTabs } from '../../shared/ui/EndpointTabs'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { Input } from '../../shared/ui/Input'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'
import { SCHEMA_BUILDER_DRAFT_STORAGE_KEY } from '../schema-builder/schemaBuilderStorage'

export function SchemasPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()

  return <SchemasPageContent key={selectedKnowledgeBaseId ?? 'none'} selectedKnowledgeBaseId={selectedKnowledgeBaseId} />
}

function SchemasPageContent({ selectedKnowledgeBaseId }: { selectedKnowledgeBaseId: string | null }) {
  const { data = [] } = useSchemasByKnowledgeBaseQuery(selectedKnowledgeBaseId)
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const activeKnowledgeBase = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId)
  const [schemaJson, setSchemaJson] = useState('')
  const [schemaDetailsLabel, setSchemaDetailsLabel] = useState('')
  const [schemaDetailsOutput, setSchemaDetailsOutput] = useState('')
  const [generatedJsonOutput, setGeneratedJsonOutput] = useState('')
  const [generatedJsonFromFileOutput, setGeneratedJsonFromFileOutput] = useState('')
  const [editingSchema, setEditingSchema] = useState<SchemaDetails | null>(null)
  const [updateDraft, setUpdateDraft] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [deleteTargetLabel, setDeleteTargetLabel] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [isGeneratePending, setIsGeneratePending] = useState(false)
  const createMutation = useCreateSchemaMutation()
  const activateMutation = useActivateSchemaMutation()
  const validateMutation = useValidateSchemaMutation()
  const getSchemaMutation = useGetSchemaMutation()
  const getSchemaForUpdateMutation = useGetSchemaMutation()
  const updateMutation = useUpdateSchemaMutation()
  const deleteMutation = useDeleteSchemaMutation()
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

  const openUpdateEditor = async (schema: Schema) => {
    setUpdateSuccess('')
    setDeleteSuccess('')
    setDeleteTargetLabel('')
    getSchemaForUpdateMutation.reset()
    updateMutation.reset()
    deleteMutation.reset()
    try {
      const details = await getSchemaForUpdateMutation.mutateAsync(schema.id)
      setEditingSchema(details)
      setUpdateDraft(details.content)
    } catch {
      // surfaced via getSchemaForUpdateMutation.error
    }
  }

  const loadSchemaDetails = async (schema: Schema) => {
    const label = `${schema.name} v${schema.version}`
    setSchemaDetailsLabel(label)
    setSchemaDetailsOutput('')
    getSchemaMutation.reset()
    try {
      const details = await getSchemaMutation.mutateAsync(schema.id)
      setSchemaDetailsOutput(JSON.stringify(details, null, 2))
    } catch {
      // surfaced via getSchemaMutation.error
    }
  }

  const saveUpdate = async () => {
    if (!editingSchema) return

    updateMutation.reset()
    try {
      const updated = await updateMutation.mutateAsync({
        schemaId: editingSchema.id,
        knowledgeBaseId: selectedKnowledgeBaseId,
        payload: {
          content: updateDraft,
          sourceType: isSupportedSchemaSourceType(editingSchema.sourceType) ? editingSchema.sourceType : undefined,
        },
      })
      setEditingSchema(updated)
      setUpdateDraft(updated.content)
      setUpdateSuccess(`Schema ${updated.name} v${updated.version} updated.`)
    } catch {
      // surfaced via updateMutation.error
    }
  }

  const cancelUpdate = () => {
    setEditingSchema(null)
    setUpdateDraft('')
    setUpdateSuccess('')
  }

  const deleteSchema = async (schema: Schema) => {
    const label = `${schema.name} v${schema.version} (${schema.id})`
    const confirmed = window.confirm(`Delete schema ${label}?`)
    if (!confirmed) return

    deleteMutation.reset()
    setDeleteTargetLabel(label)
    setDeleteSuccess('')
    try {
      await deleteMutation.mutateAsync({ schemaId: schema.id, knowledgeBaseId: selectedKnowledgeBaseId })
      if (editingSchema?.id === schema.id) {
        cancelUpdate()
      }
      setDeleteSuccess(`Schema ${label} deleted.`)
      setDeleteTargetLabel('')
    } catch {
      // surfaced via deleteMutation.error
    }
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
                  void loadSchemaDetails(schema)
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
                  void openUpdateEditor(schema)
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
                  void deleteSchema(schema)
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
            onChange={(e) => setSchemaDetailsOutput(e.target.value)}
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
            onChange={setUpdateDraft}
            placeholder='Schema JSON content'
            disabled={updateMutation.isPending}
          />
          <div className='toolbar'>
            <Button type='button' variant='primary' isPending={updateMutation.isPending} pendingText='Saving...' onClick={() => void saveUpdate()}>
              Save
            </Button>
            <Button type='button' disabled={updateMutation.isPending} onClick={cancelUpdate}>
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
        <div className='stack' data-testid='schema-validation-section'>
          <FieldLabel htmlFor='validate-schema-json-input'>Schema JSON content</FieldLabel>
          <SchemaJsonEditor
            id='validate-schema-json-input'
            label='Schema JSON content'
            value={schemaJson}
            onChange={setSchemaJson}
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
      ),
    },
    {
      id: 'schema-creation',
      label: 'Schema creation',
      content: (
        <div className='stack' data-testid='schema-creation-section'>
          <FieldLabel htmlFor='create-schema-json'>Schema JSON content</FieldLabel>
          <SchemaJsonEditor
            id='create-schema-json'
            label='Schema JSON content'
            value={schemaJson}
            onChange={setSchemaJson}
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

function SourceModeSelector({
  value,
  onChange,
  name,
}: {
  value: 'text' | 'file'
  onChange: (value: 'text' | 'file') => void
  name: string
}) {
  return (
    <fieldset className='stack'>
      <legend className='field-label'>Source</legend>
      <div className='toolbar'>
        {[
          ['text', 'From text'],
          ['file', 'From file'],
        ].map(([optionValue, label]) => (
          <label key={optionValue} className='check-row'>
            <input
              type='radio'
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue as 'text' | 'file')}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function isSupportedSchemaSourceType(sourceType: string): sourceType is SchemaSourceType {
  return sourceType === 'PREDEFINED' || sourceType === 'GENERATED'
}

function formatSchemaSourceTypeLabel(sourceType: string) {
  return isSupportedSchemaSourceType(sourceType) ? sourceType : `UNSUPPORTED (${sourceType})`
}

function navigateToSchemaBuilder(url: string) {
  window.history.pushState({}, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function SchemaGenerationWarnings({ warnings }: { warnings?: SchemaGenerationWarning[] }) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className='notice warning'>
      <h4>Schema generation warnings</h4>
      <ul className='stack'>
        {warnings.map((warning, index) => (
          <li key={`${warning.code ?? 'warning'}-${index}`}>
            {warning.code ? <span className='font-semibold'>{warning.code}: </span> : null}
            <span>{warning.message}</span>
            {warning.suggestion ? <span> Suggestion: {warning.suggestion}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SchemaExampleGenerationWorkflow({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [sourceMode, setSourceMode] = useState<'text' | 'file'>('text')

  return (
    <div className='stack' data-testid='schema-example-generation-section'>
      <SourceModeSelector value={sourceMode} onChange={setSourceMode} name='schema-example-source-mode' />
      {sourceMode === 'text' ? (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-example-text'>
          <SchemaGenerateExampleFromText onPendingChange={onPendingChange} />
        </div>
      ) : (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-example-file'>
          <SchemaGenerateExampleFromFile onPendingChange={onPendingChange} />
        </div>
      )}
    </div>
  )
}

function SchemaJsonGenerationWorkflow(
  {
    textOutput, fileOutput, onTextOutputReady, onFileOutputReady, onOpenInBuilder, onPendingChange,
  }: {
    textOutput: string
    fileOutput: string
    onTextOutputReady: (json: string) => void
    onFileOutputReady: (json: string) => void
    onOpenInBuilder: (json: string) => void
    onPendingChange: (isPending: boolean) => void
  },
) {
  const [sourceMode, setSourceMode] = useState<'text' | 'file'>('text')

  return (
    <div className='stack' data-testid='schema-json-generation-section'>
      <SourceModeSelector value={sourceMode} onChange={setSourceMode} name='schema-json-source-mode' />
      {sourceMode === 'text' ? (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-json'>
          <SchemaGenerateJsonFromText
            onJsonReady={onTextOutputReady}
            output={textOutput}
            onOutputReady={onTextOutputReady}
            onOpenInBuilder={onOpenInBuilder}
            onPendingChange={onPendingChange}
          />
        </div>
      ) : (
        <div className='flow-card' data-testid='schemas-workflow-generate-schema-json-file'>
          <SchemaGenerateJsonFromFile
            onJsonReady={onFileOutputReady}
            output={fileOutput}
            onOutputReady={onFileOutputReady}
            onOpenInBuilder={onOpenInBuilder}
            onPendingChange={onPendingChange}
          />
        </div>
      )}
    </div>
  )
}

function SchemaGenerateExampleFromText({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [text, setText] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [example, setExample] = useState('')
  const generateExample = useGenerateSchemaExampleMutation()

  useEffect(() => {
    onPendingChange(generateExample.isPending)
  }, [generateExample.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateExample.isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FieldLabel htmlFor='generate-example-text-source'>Source text</FieldLabel>
      <Textarea id='generate-example-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-example-text-guidance'>Generation guidance (optional)</FieldLabel>
      <Textarea id='generate-example-text-guidance' rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder='Optional generation guidance' />
      <Button
        type='button'
        variant='primary'
        isPending={generateExample.isPending}
        pendingText='Generating...'
        onClick={async () => {
          try {
            const res = await generateExample.mutateAsync({ text, userPrompt })
            setExample(res.example)
          } catch {
            // surfaced via generateExample.error
          }
        }}
      >
        Generate schema example
      </Button>
      <FieldLabel htmlFor='generate-example-text-output'>Generated schema example</FieldLabel>
      <Textarea id='generate-example-text-output' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      {generateExample.error && <Alert title='Generation failed' message={(generateExample.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateExampleFromFile({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const generateExampleFromFile = useGenerateSchemaExampleFromFileMutation()

  useEffect(() => {
    onPendingChange(generateExampleFromFile.isPending)
  }, [generateExampleFromFile.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateExampleFromFile.isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FileSelectButton
        buttonLabel='Select source file'
        testId='schemas-example-file-select'
        onFileSelected={async (file) => {
          setSelectedFile(file)
          setSelectedFilename(file.name)
        }}
      />
      {selectedFilename && <p>Selected file: {selectedFilename}</p>}
      <Button
        type='button'
        variant='primary'
        isPending={generateExampleFromFile.isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          if (!selectedFile) {
            setError('Select a source file before generating schema example.')
            return
          }
          try {
            const res = await generateExampleFromFile.mutateAsync({ file: selectedFile })
            setExample(res.example)
          } catch {
            // surfaced via generateExampleFromFile.error
          }
        }}
      >
        Generate schema example from file
      </Button>
      <FieldLabel htmlFor='generate-example-file-output'>Generated schema example</FieldLabel>
      <Textarea id='generate-example-file-output' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      {(error || generateExampleFromFile.error) && <Alert title='Generation failed' message={error ?? (generateExampleFromFile.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateJsonFromText(
  {
    onJsonReady, output, onOutputReady, onOpenInBuilder, onPendingChange,
  }: {
    onJsonReady: (json: string) => void
    output: string
    onOutputReady: (json: string) => void
    onOpenInBuilder: (json: string) => void
    onPendingChange: (isPending: boolean) => void
  },
) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [example, setExample] = useState('')
  const [exampleFormatError, setExampleFormatError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<SchemaGenerationWarning[]>([])
  const generateJson = useGenerateSchemaJsonMutation()

  useEffect(() => {
    onPendingChange(generateJson.isPending)
  }, [generateJson.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateJson.isPending ? <ProgressBanner message='Waiting for schema JSON generation...' /> : null}
      <FieldLabel htmlFor='generate-json-text-name'>Schema name</FieldLabel>
      <Input id='generate-json-text-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-json-text-version'>Schema version</FieldLabel>
      <Input id='generate-json-text-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FieldLabel htmlFor='generate-json-text-source'>Source text</FieldLabel>
      <Textarea id='generate-json-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-json-text-example'>Schema example JSON</FieldLabel>
      <StructuredPayloadEditor
        id='generate-json-text-example'
        format='json'
        rows={5}
        value={example}
        onChange={setExample}
        error={exampleFormatError}
        onErrorChange={setExampleFormatError}
        placeholder='Schema example JSON'
      />
      <Button
        type='button'
        variant='primary'
        isPending={generateJson.isPending}
        pendingText='Generating...'
        onClick={async () => {
          try {
            const res = await generateJson.mutateAsync({ name, version, text, example })
            onJsonReady(res.content)
            onOutputReady(res.content)
            setWarnings(res.warnings ?? [])
          } catch {
            // surfaced via generateJson.error
          }
        }}
      >
        Generate schema JSON
      </Button>
      <FieldLabel htmlFor='generate-json-text-output'>Generated schema JSON</FieldLabel>
      <SchemaJsonEditor
        id='generate-json-text-output'
        label='Generated schema JSON'
        value={output}
        onChange={onOutputReady}
        placeholder='Generated JSON response'
        disabled={generateJson.isPending}
      />
      {output.trim() ? (
        <Button type='button' onClick={() => onOpenInBuilder(output)} disabled={generateJson.isPending}>
          Open in Builder
        </Button>
      ) : null}
      <SchemaGenerationWarnings warnings={warnings} />
      {generateJson.error && <Alert title='Generation failed' message={(generateJson.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateJsonFromFile(
  {
    onJsonReady, output, onOutputReady, onOpenInBuilder, onPendingChange,
  }: {
    onJsonReady: (json: string) => void
    output: string
    onOutputReady: (json: string) => void
    onOpenInBuilder: (json: string) => void
    onPendingChange: (isPending: boolean) => void
  },
) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exampleFormatError, setExampleFormatError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<SchemaGenerationWarning[]>([])
  const generateJsonFromFile = useGenerateSchemaJsonFromFileMutation()

  useEffect(() => {
    onPendingChange(generateJsonFromFile.isPending)
  }, [generateJsonFromFile.isPending, onPendingChange])

  return (
    <div className='stack'>
      {generateJsonFromFile.isPending ? <ProgressBanner message='Waiting for schema JSON generation...' /> : null}
      <FieldLabel htmlFor='generate-json-file-name'>Schema name</FieldLabel>
      <Input id='generate-json-file-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-json-file-version'>Schema version</FieldLabel>
      <Input id='generate-json-file-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FileSelectButton
        buttonLabel='Select source text file'
        testId='schemas-json-file-select'
        onFileSelected={async (file) => {
          setSelectedFile(file)
          setSelectedFilename(file.name)
        }}
      />
      {selectedFilename && <p>Selected file: {selectedFilename}</p>}
      <FieldLabel htmlFor='generate-json-file-example'>Schema example JSON</FieldLabel>
      <StructuredPayloadEditor
        id='generate-json-file-example'
        format='json'
        rows={5}
        value={example}
        onChange={setExample}
        error={exampleFormatError}
        onErrorChange={setExampleFormatError}
        placeholder='Schema example JSON'
      />
      <Button
        type='button'
        variant='primary'
        isPending={generateJsonFromFile.isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          if (!selectedFile) {
            setError('Select a source file before generating schema JSON.')
            return
          }
          try {
            const res = await generateJsonFromFile.mutateAsync({ name, version, example, file: selectedFile })
            onJsonReady(res.content)
            onOutputReady(res.content)
            setWarnings(res.warnings ?? [])
          } catch {
            // surfaced via generateJsonFromFile.error
          }
        }}
      >
        Generate schema JSON from file
      </Button>
      <FieldLabel htmlFor='generate-json-file-output'>Generated schema JSON</FieldLabel>
      <SchemaJsonEditor
        id='generate-json-file-output'
        label='Generated schema JSON'
        value={output}
        onChange={onOutputReady}
        placeholder='Generated JSON response'
        disabled={generateJsonFromFile.isPending}
      />
      {output.trim() ? (
        <Button type='button' onClick={() => onOpenInBuilder(output)} disabled={generateJsonFromFile.isPending}>
          Open in Builder
        </Button>
      ) : null}
      <SchemaGenerationWarnings warnings={warnings} />
      {(error || generateJsonFromFile.error) && <Alert title='Generation failed' message={error ?? (generateJsonFromFile.error as Error).message} />}
    </div>
  )
}
