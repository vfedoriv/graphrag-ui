import { useState } from 'react'
import { schemasApi, useActivateSchemaMutation, useCreateSchemaMutation, useSchemasQuery } from '../../api/schemas'
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
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

export function SchemasPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data = [] } = useSchemasQuery()
  const [yaml, setYaml] = useState('')
  const [schemaId, setSchemaId] = useState('')
  const [schemaByIdOutput, setSchemaByIdOutput] = useState('')
  const [generatedYamlOutput, setGeneratedYamlOutput] = useState('')
  const [generatedYamlFromFileOutput, setGeneratedYamlFromFileOutput] = useState('')
  const [getSchemaError, setGetSchemaError] = useState<string>('')
  const [isGetSchemaPending, setIsGetSchemaPending] = useState(false)
  const [validation, setValidation] = useState<string[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidatePending, setIsValidatePending] = useState(false)
  const [isGeneratePending, setIsGeneratePending] = useState(false)
  const [yamlFormatError, setYamlFormatError] = useState<string | null>(null)
  const createMutation = useCreateSchemaMutation()
  const activateMutation = useActivateSchemaMutation()
  const isAnyPending = createMutation.isPending || activateMutation.isPending || isGetSchemaPending || isValidatePending || isGeneratePending

  const topSection = (
    <>
      {data.length === 0 ? (
        <EmptyState title='No Schemas' body='Create or generate one, then activate it for the selected knowledge base.' />
      ) : (
        <Table
          headers={['ID', 'Name', 'Version', 'Status', 'Activate']}
          rows={data.map((schema) => [
            schema.id,
            schema.name,
            String(schema.version),
            schema.status,
            <Button
              type='button'
              disabled={!selectedKnowledgeBaseId}
              isPending={activateMutation.isPending}
              pendingText='Activating...'
              onClick={() => selectedKnowledgeBaseId && activateMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, schemaId: schema.id })}
            >
              Activate
            </Button>,
          ])}
        />
      )}
      {!selectedKnowledgeBaseId && <Alert title='No knowledge base selected' message='Activation requires selecting a knowledge base in the header or KB page.' tone='info' />}
      {activateMutation.error && <Alert title='Activate failed' message={(activateMutation.error as Error).message} />}
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
      id: 'generate-schema-yaml',
      label: 'Generate schema YAML',
      content: (
        <SchemaGenerateYamlFromText
          onYamlReady={setYaml}
          output={generatedYamlOutput}
          onOutputReady={setGeneratedYamlOutput}
          onPendingChange={setIsGeneratePending}
        />
      ),
    },
    {
      id: 'generate-schema-yaml-file',
      label: 'Generate schema YAML from file',
      content: (
        <SchemaGenerateYamlFromFile
          onYamlReady={setYaml}
          output={generatedYamlFromFileOutput}
          onOutputReady={setGeneratedYamlFromFileOutput}
          onPendingChange={setIsGeneratePending}
        />
      ),
    },
    {
      id: 'validate-schema-yaml',
      label: 'Validate schema YAML',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='validate-schema-yaml-input'>Schema YAML content</FieldLabel>
          <StructuredPayloadEditor
            id='validate-schema-yaml-input'
            format='yaml'
            rows={8}
            value={yaml}
            onChange={setYaml}
            error={yamlFormatError}
            onErrorChange={setYamlFormatError}
            placeholder='Paste YAML schema content'
          />
          <Button
            type='button'
            isPending={isValidatePending}
            pendingText='Validating...'
            onClick={async () => {
              setValidationError(null)
              setIsValidatePending(true)
              try {
                setValidation((await schemasApi.validate({ content: yaml })).errors)
              } catch (error) {
                setValidationError((error as Error).message)
              } finally {
                setIsValidatePending(false)
              }
            }}
          >
            Validate schema YAML
          </Button>
          {validationError && <Alert title='Validate failed' message={validationError} />}
          {validation && (validation.length === 0 ? <p className='text-sm text-emerald-700'>Schema is valid.</p> : <Alert title='Schema validation errors' message={validation.join('; ')} />)}
        </div>
      ),
    },
    {
      id: 'create-schema',
      label: 'Create schema',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='create-schema-yaml'>Schema YAML content</FieldLabel>
          <StructuredPayloadEditor
            id='create-schema-yaml'
            format='yaml'
            rows={8}
            value={yaml}
            onChange={setYaml}
            error={yamlFormatError}
            onErrorChange={setYamlFormatError}
            placeholder='Paste YAML schema content'
          />
          <Button type='button' className='bg-emerald-700' isPending={createMutation.isPending} pendingText='Creating...' onClick={() => createMutation.mutate({ content: yaml, sourceType: 'USER_DEFINED' })}>Create</Button>
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
            isPending={isGetSchemaPending}
            pendingText='Loading...'
            onClick={async () => {
              setGetSchemaError('')
              setSchemaByIdOutput('')
              setIsGetSchemaPending(true)
              try {
                const schema = await schemasApi.get(schemaId)
                setSchemaByIdOutput(JSON.stringify(schema, null, 2))
              } catch (e) {
                setGetSchemaError((e as Error).message)
              } finally {
                setIsGetSchemaPending(false)
              }
            }}
          >
            Get schema by ID
          </Button>
          <FieldLabel htmlFor='get-schema-by-id-output'>Schema details JSON</FieldLabel>
          <Textarea id='get-schema-by-id-output' rows={8} value={schemaByIdOutput} onChange={(e) => setSchemaByIdOutput(e.target.value)} placeholder='Schema details response' />
          {getSchemaError && <Alert title='Get schema failed' message={getSchemaError} />}
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

function SchemaGenerateExampleFromText({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [text, setText] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  return (
    <div className='space-y-2'>
      {isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FieldLabel htmlFor='generate-example-text-source'>Source text</FieldLabel>
      <Textarea id='generate-example-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-example-text-guidance'>Generation guidance (optional)</FieldLabel>
      <Textarea id='generate-example-text-guidance' rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder='Optional generation guidance' />
      <Button
        type='button'
        isPending={isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          setIsPending(true)
          onPendingChange(true)
          try {
            const res = await schemasApi.generateExample({ text, userPrompt })
            setExample(res.example)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setIsPending(false)
            onPendingChange(false)
          }
        }}
      >
        Generate schema example
      </Button>
      <FieldLabel htmlFor='generate-example-text-output'>Generated schema example</FieldLabel>
      <Textarea id='generate-example-text-output' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}

function SchemaGenerateExampleFromFile({ onPendingChange }: { onPendingChange: (isPending: boolean) => void }) {
  const [fileText, setFileText] = useState('')
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  return (
    <div className='space-y-2'>
      {isPending ? <ProgressBanner message='Waiting for schema example generation...' /> : null}
      <FileSelectButton
        buttonLabel='Select source file'
        testId='schemas-example-file-select'
        onFileSelected={async (file) => {
          setSelectedFilename(file.name)
          setFileText(await file.text())
        }}
      />
      {selectedFilename && <p className='text-sm text-slate-600'>Selected file: {selectedFilename}</p>}
      <Button
        type='button'
        isPending={isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          setIsPending(true)
          onPendingChange(true)
          try {
            const res = await schemasApi.generateExample({ text: fileText })
            setExample(res.example)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setIsPending(false)
            onPendingChange(false)
          }
        }}
      >
        Generate schema example from file
      </Button>
      <FieldLabel htmlFor='generate-example-file-output'>Generated schema example</FieldLabel>
      <Textarea id='generate-example-file-output' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}

function SchemaGenerateYamlFromText(
  {
    onYamlReady, output, onOutputReady, onPendingChange,
  }: { onYamlReady: (yaml: string) => void, output: string, onOutputReady: (yaml: string) => void, onPendingChange: (isPending: boolean) => void },
) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exampleFormatError, setExampleFormatError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  return (
    <div className='space-y-2'>
      {isPending ? <ProgressBanner message='Waiting for schema YAML generation...' /> : null}
      <FieldLabel htmlFor='generate-yaml-text-name'>Schema name</FieldLabel>
      <Input id='generate-yaml-text-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-yaml-text-version'>Schema version</FieldLabel>
      <Input id='generate-yaml-text-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FieldLabel htmlFor='generate-yaml-text-source'>Source text</FieldLabel>
      <Textarea id='generate-yaml-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-yaml-text-example'>Schema example JSON</FieldLabel>
      <StructuredPayloadEditor
        id='generate-yaml-text-example'
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
        isPending={isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          onOutputReady('')
          setIsPending(true)
          onPendingChange(true)
          try {
            const res = await schemasApi.generateYaml({ name, version, text, example })
            onYamlReady(res.content)
            onOutputReady(res.content)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setIsPending(false)
            onPendingChange(false)
          }
        }}
      >
        Generate schema YAML
      </Button>
      <FieldLabel htmlFor='generate-yaml-text-output'>Generated schema YAML</FieldLabel>
      <Textarea id='generate-yaml-text-output' rows={8} value={output} onChange={(e) => onOutputReady(e.target.value)} placeholder='Generated YAML response' />
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}

function SchemaGenerateYamlFromFile(
  {
    onYamlReady, output, onOutputReady, onPendingChange,
  }: { onYamlReady: (yaml: string) => void, output: string, onOutputReady: (yaml: string) => void, onPendingChange: (isPending: boolean) => void },
) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exampleFormatError, setExampleFormatError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  return (
    <div className='space-y-2'>
      {isPending ? <ProgressBanner message='Waiting for schema YAML generation...' /> : null}
      <FieldLabel htmlFor='generate-yaml-file-name'>Schema name</FieldLabel>
      <Input id='generate-yaml-file-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-yaml-file-version'>Schema version</FieldLabel>
      <Input id='generate-yaml-file-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FileSelectButton
        buttonLabel='Select source text file'
        testId='schemas-yaml-file-select'
        onFileSelected={async (file) => {
          setSelectedFilename(file.name)
          setText(await file.text())
        }}
      />
      {selectedFilename && <p className='text-sm text-slate-600'>Selected file: {selectedFilename}</p>}
      <FieldLabel htmlFor='generate-yaml-file-example'>Schema example JSON</FieldLabel>
      <StructuredPayloadEditor
        id='generate-yaml-file-example'
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
        isPending={isPending}
        pendingText='Generating...'
        onClick={async () => {
          setError(null)
          onOutputReady('')
          setIsPending(true)
          onPendingChange(true)
          try {
            const res = await schemasApi.generateYaml({ name, version, text, example })
            onYamlReady(res.content)
            onOutputReady(res.content)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setIsPending(false)
            onPendingChange(false)
          }
        }}
      >
        Generate schema YAML from file
      </Button>
      <FieldLabel htmlFor='generate-yaml-file-output'>Generated schema YAML</FieldLabel>
      <Textarea id='generate-yaml-file-output' rows={8} value={output} onChange={(e) => onOutputReady(e.target.value)} placeholder='Generated YAML response' />
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}
