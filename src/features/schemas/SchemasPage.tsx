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
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

export function SchemasPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data = [] } = useSchemasQuery()
  const [yaml, setYaml] = useState('')
  const [schemaId, setSchemaId] = useState('')
  const [selectedSchema, setSelectedSchema] = useState<string>('')
  const [getSchemaError, setGetSchemaError] = useState<string>('')
  const [validation, setValidation] = useState<string[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const createMutation = useCreateSchemaMutation()
  const activateMutation = useActivateSchemaMutation()

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
              disabled={!selectedKnowledgeBaseId || activateMutation.isPending}
              onClick={() => selectedKnowledgeBaseId && activateMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, schemaId: schema.id })}
            >
              Activate
            </Button>,
          ])}
        />
      )}
      {!selectedKnowledgeBaseId && <Alert title='No knowledge base selected' message='Activation requires selecting a knowledge base in the header or KB page.' tone='info' />}
      {activateMutation.error && <Alert title='Activate failed' message={(activateMutation.error as Error).message} />}
    </>
  )

  const tabs: EndpointTab[] = [
    {
      id: 'create-schema',
      label: 'Create schema',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='create-schema-yaml'>Schema YAML content</FieldLabel>
          <Textarea id='create-schema-yaml' rows={8} value={yaml} onChange={(e) => setYaml(e.target.value)} placeholder='Paste YAML schema content' />
          <Button type='button' className='bg-emerald-700' onClick={() => createMutation.mutate({ content: yaml, sourceType: 'USER_DEFINED' })}>Create</Button>
          {createMutation.error && <Alert title='Create failed' message={(createMutation.error as Error).message} />}
        </div>
      ),
    },
    {
      id: 'generate-schema-yaml',
      label: 'Generate schema YAML',
      content: <SchemaGenerateYamlFromText onYamlReady={setYaml} />,
    },
    {
      id: 'generate-schema-yaml-file',
      label: 'Generate schema YAML from file',
      content: <SchemaGenerateYamlFromFile onYamlReady={setYaml} />,
    },
    {
      id: 'generate-schema-example-text',
      label: 'Generate schema example from text',
      content: <SchemaGenerateExampleFromText />,
    },
    {
      id: 'generate-schema-example-file',
      label: 'Generate schema example from file',
      content: <SchemaGenerateExampleFromFile />,
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
            onClick={async () => {
              setGetSchemaError('')
              try {
                const schema = await schemasApi.get(schemaId)
                setSelectedSchema(JSON.stringify(schema, null, 2))
              } catch (e) {
                setGetSchemaError((e as Error).message)
              }
            }}
          >
            Get schema by ID
          </Button>
          {getSchemaError && <Alert title='Get schema failed' message={getSchemaError} />}
          {selectedSchema && <OutputPreview label='Schema details JSON'>{selectedSchema}</OutputPreview>}
        </div>
      ),
    },
    {
      id: 'validate-schema-yaml',
      label: 'Validate schema YAML',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='validate-schema-yaml-input'>Schema YAML content</FieldLabel>
          <Textarea id='validate-schema-yaml-input' rows={8} value={yaml} onChange={(e) => setYaml(e.target.value)} placeholder='Paste YAML schema content' />
          <Button
            type='button'
            onClick={async () => {
              setValidationError(null)
              try {
                setValidation((await schemasApi.validate({ content: yaml })).errors)
              } catch (error) {
                setValidationError((error as Error).message)
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
  ]

  return (
    <ControllerPage
      title='Schemas'
      topSectionTitle='Schemas list'
      topSection={topSection}
      tabs={<EndpointTabs tabs={tabs} testId='schemas-endpoint-tabs' />}
      testId='schemas-controller-page'
    />
  )
}

function SchemaGenerateExampleFromText() {
  const [text, setText] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className='space-y-2'>
      <FieldLabel htmlFor='generate-example-text-source'>Source text</FieldLabel>
      <Textarea id='generate-example-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-example-text-guidance'>Generation guidance (optional)</FieldLabel>
      <Textarea id='generate-example-text-guidance' rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder='Optional generation guidance' />
      <Button
        type='button'
        onClick={async () => {
          setError(null)
          try {
            const res = await schemasApi.generateExample({ text, userPrompt })
            setExample(res.example)
          } catch (e) {
            setError((e as Error).message)
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

function SchemaGenerateExampleFromFile() {
  const [fileText, setFileText] = useState('')
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className='space-y-2'>
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
        onClick={async () => {
          setError(null)
          try {
            const res = await schemasApi.generateExample({ text: fileText })
            setExample(res.example)
          } catch (e) {
            setError((e as Error).message)
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

function SchemaGenerateYamlFromText({ onYamlReady }: { onYamlReady: (yaml: string) => void }) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className='space-y-2'>
      <FieldLabel htmlFor='generate-yaml-text-name'>Schema name</FieldLabel>
      <Input id='generate-yaml-text-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <FieldLabel htmlFor='generate-yaml-text-version'>Schema version</FieldLabel>
      <Input id='generate-yaml-text-version' type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <FieldLabel htmlFor='generate-yaml-text-source'>Source text</FieldLabel>
      <Textarea id='generate-yaml-text-source' rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <FieldLabel htmlFor='generate-yaml-text-example'>Schema example JSON</FieldLabel>
      <Textarea id='generate-yaml-text-example' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Schema example JSON' />
      <Button
        type='button'
        className='bg-emerald-700'
        onClick={async () => {
          setError(null)
          try {
            const res = await schemasApi.generateYaml({ name, version, text, example })
            onYamlReady(res.content)
          } catch (e) {
            setError((e as Error).message)
          }
        }}
      >
        Generate schema YAML
      </Button>
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}

function SchemaGenerateYamlFromFile({ onYamlReady }: { onYamlReady: (yaml: string) => void }) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [selectedFilename, setSelectedFilename] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className='space-y-2'>
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
      <Textarea id='generate-yaml-file-example' rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Schema example JSON' />
      <Button
        type='button'
        className='bg-emerald-700'
        onClick={async () => {
          setError(null)
          try {
            const res = await schemasApi.generateYaml({ name, version, text, example })
            onYamlReady(res.content)
          } catch (e) {
            setError((e as Error).message)
          }
        }}
      >
        Generate schema YAML from file
      </Button>
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}
