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
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

export function SchemasPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()

  return <SchemasPageContent key={selectedKnowledgeBaseId ?? 'none'} selectedKnowledgeBaseId={selectedKnowledgeBaseId} />
}

function SchemasPageContent({ selectedKnowledgeBaseId }: { selectedKnowledgeBaseId: string | null }) {
  const { data = [] } = useSchemasByKnowledgeBaseQuery(selectedKnowledgeBaseId)
  const [schemaJson, setSchemaJson] = useState('')
  const [schemaId, setSchemaId] = useState('')
  const [schemaByIdOutput, setSchemaByIdOutput] = useState('')
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
          headers={['ID', 'Name', 'Version', 'Source Type', 'Status', 'Actions']}
          rowKeys={data.map((schema) => schema.id)}
          rows={data.map((schema) => [
            schema.id,
            schema.name,
            String(schema.version),
            formatSchemaSourceTypeLabel(schema.sourceType),
            schema.status,
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                disabled={!selectedKnowledgeBaseId || schema.status === 'ACTIVE'}
                isPending={activateMutation.isPending}
                pendingText='Activating...'
                onClick={() => selectedKnowledgeBaseId && activateMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, schemaId: schema.id })}
              >
                {schema.status === 'ACTIVE' ? 'Active' : 'Activate'}
              </Button>
              <Button
                type='button'
                className='bg-slate-700'
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
                className='bg-red-700'
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
      {editingSchema && (
        <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4'>
          <div>
            <h3 className='text-sm font-semibold text-slate-900'>Update schema</h3>
            <p className='text-sm text-slate-600'>
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
          <div className='flex flex-wrap gap-2'>
            <Button type='button' className='bg-emerald-700' isPending={updateMutation.isPending} pendingText='Saving...' onClick={() => void saveUpdate()}>
              Save
            </Button>
            <Button type='button' className='bg-white text-slate-900' disabled={updateMutation.isPending} onClick={cancelUpdate}>
              Cancel
            </Button>
          </div>
          {updateSuccess && <p className='text-sm text-emerald-700'>{updateSuccess}</p>}
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
      {deleteSuccess && <p className='text-sm text-emerald-700'>{deleteSuccess}</p>}
      {deleteMutation.error && <Alert title='Delete failed' message={`Schema ${deleteTargetLabel}: ${(deleteMutation.error as Error).message}`} />}
      {isAnyPending ? <ProgressBanner message='Waiting for schema workflow response...' /> : null}
    </>
  )

  const tabs: EndpointTab[] = [
    {
      id: 'generate-schema-example-text',
      label: 'Generate schema example from text',
      content: <SchemaGenerateExampleFromText onPendingChange={setIsGeneratePending} />,
    },
    {
      id: 'generate-schema-example-file',
      label: 'Generate schema example from file',
      content: <SchemaGenerateExampleFromFile onPendingChange={setIsGeneratePending} />,
    },
    {
      id: 'generate-schema-json',
      label: 'Generate schema JSON',
      content: (
        <SchemaGenerateJsonFromText
          onJsonReady={setSchemaJson}
          output={generatedJsonOutput}
          onOutputReady={(json) => {
            setGeneratedJsonOutput(json)
            setSchemaJson(json)
          }}
          onPendingChange={setIsGeneratePending}
        />
      ),
    },
    {
      id: 'generate-schema-json-file',
      label: 'Generate schema JSON from file',
      content: (
        <SchemaGenerateJsonFromFile
          onJsonReady={setSchemaJson}
          output={generatedJsonFromFileOutput}
          onOutputReady={(json) => {
            setGeneratedJsonFromFileOutput(json)
            setSchemaJson(json)
          }}
          onPendingChange={setIsGeneratePending}
        />
      ),
    },
    {
      id: 'validate-schema-json',
      label: 'Validate schema JSON',
      content: (
        <div className='space-y-2'>
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
            isPending={validateMutation.isPending}
            pendingText='Validating...'
            onClick={() => validateMutation.mutate({ content: schemaJson })}
          >
            Validate schema JSON
          </Button>
          {validateMutation.error && <Alert title='Validate failed' message={(validateMutation.error as Error).message} />}
          {validateMutation.data && (validateMutation.data.errors.length === 0 ? <p className='text-sm text-emerald-700'>Schema is valid.</p> : <Alert title='Schema validation errors' message={validateMutation.data.errors.join('; ')} />)}
        </div>
      ),
    },
    {
      id: 'create-schema',
      label: 'Create schema',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='create-schema-json'>Schema JSON content</FieldLabel>
          <SchemaJsonEditor
            id='create-schema-json'
            label='Schema JSON content'
            value={schemaJson}
            onChange={setSchemaJson}
            placeholder='Paste JSON schema content'
            disabled={createMutation.isPending}
          />
          <Button type='button' className='bg-emerald-700' isPending={createMutation.isPending} pendingText='Creating...' onClick={() => createMutation.mutate({ content: schemaJson, sourceType: 'PREDEFINED' })}>Create</Button>
          {createMutation.error && <Alert title='Create failed' message={(createMutation.error as Error).message} />}
        </div>
      ),
    },
    {
      id: 'get-schema-by-id',
      label: 'Get schema by ID',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='get-schema-id'>Schema ID</FieldLabel>
          <Input id='get-schema-id' value={schemaId} onChange={(e) => setSchemaId(e.target.value)} placeholder='Schema ID' />
          <Button
            type='button'
            isPending={getSchemaMutation.isPending}
            pendingText='Loading...'
            onClick={async () => {
              try {
                const schema = await getSchemaMutation.mutateAsync(schemaId)
                setSchemaByIdOutput(JSON.stringify(schema, null, 2))
              } catch {
                // surfaced via getSchemaMutation.error
              }
            }}
          >
            Get schema by ID
          </Button>
          <FieldLabel htmlFor='get-schema-by-id-output'>Schema details JSON</FieldLabel>
          <Textarea id='get-schema-by-id-output' rows={8} value={schemaByIdOutput} onChange={(e) => setSchemaByIdOutput(e.target.value)} placeholder='Schema details response' />
          {getSchemaMutation.error && <Alert title='Get schema failed' message={(getSchemaMutation.error as Error).message} />}
        </div>
      ),
    },
  ]

  return (
    <ControllerPage
      title='Schemas'
      topSectionTitle='Schemas list'
      topSection={topSection}
      tabs={<EndpointTabs tabs={tabs} testId='schemas-endpoint-tabs' disableTabSwitch={isAnyPending} keepPanelsMounted />}
      testId='schemas-controller-page'
    />
  )
}

function isSupportedSchemaSourceType(sourceType: string): sourceType is SchemaSourceType {
  return sourceType === 'PREDEFINED' || sourceType === 'GENERATED'
}

function formatSchemaSourceTypeLabel(sourceType: string) {
  return isSupportedSchemaSourceType(sourceType) ? sourceType : `UNSUPPORTED (${sourceType})`
}

function SchemaGenerationWarnings({ warnings }: { warnings?: SchemaGenerationWarning[] }) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className='rounded-md border border-amber-300 bg-amber-50 p-3'>
      <h4 className='text-sm font-semibold text-amber-950'>Schema generation warnings</h4>
      <ul className='mt-2 space-y-2 text-sm text-amber-950'>
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

function SchemaGenerateExampleFromText({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [text, setText] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [example, setExample] = useState('')
  const generateExample = useGenerateSchemaExampleMutation()

  useEffect(() => {
    onPendingChange(generateExample.isPending)
  }, [generateExample.isPending, onPendingChange])

  return (
    <div className='space-y-2'>
      {generateExample.isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FieldLabel htmlFor='generate-example-text-source'>Source text</FieldLabel>
      <Textarea id='generate-example-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-example-text-guidance'>Generation guidance (optional)</FieldLabel>
      <Textarea id='generate-example-text-guidance' rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder='Optional generation guidance' />
      <Button
        type='button'
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
    <div className='space-y-2'>
      {generateExampleFromFile.isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FileSelectButton
        buttonLabel='Select source file'
        testId='schemas-example-file-select'
        onFileSelected={async (file) => {
          setSelectedFile(file)
          setSelectedFilename(file.name)
        }}
      />
      {selectedFilename && <p className='text-sm text-slate-600'>Selected file: {selectedFilename}</p>}
      <Button
        type='button'
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
    onJsonReady, output, onOutputReady, onPendingChange,
  }: { onJsonReady: (json: string) => void, output: string, onOutputReady: (json: string) => void, onPendingChange: (isPending: boolean) => void },
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
    <div className='space-y-2'>
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
        className='bg-emerald-700'
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
      <SchemaGenerationWarnings warnings={warnings} />
      {generateJson.error && <Alert title='Generation failed' message={(generateJson.error as Error).message} />}
    </div>
  )
}

function SchemaGenerateJsonFromFile(
  {
    onJsonReady, output, onOutputReady, onPendingChange,
  }: { onJsonReady: (json: string) => void, output: string, onOutputReady: (json: string) => void, onPendingChange: (isPending: boolean) => void },
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
    <div className='space-y-2'>
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
      {selectedFilename && <p className='text-sm text-slate-600'>Selected file: {selectedFilename}</p>}
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
        className='bg-emerald-700'
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
      <SchemaGenerationWarnings warnings={warnings} />
      {(error || generateJsonFromFile.error) && <Alert title='Generation failed' message={error ?? (generateJsonFromFile.error as Error).message} />}
    </div>
  )
}
