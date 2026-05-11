import { useState } from 'react'
import { schemasApi, useActivateSchemaMutation, useCreateSchemaMutation, useSchemasQuery } from '../../api/schemas'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Input } from '../../shared/ui/Input'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

export function SchemasPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data = [] } = useSchemasQuery()
  const [yaml, setYaml] = useState('')
  const [validation, setValidation] = useState<string[] | null>(null)
  const createMutation = useCreateSchemaMutation()
  const activateMutation = useActivateSchemaMutation()

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Schemas</h1>
      <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4'>
        <h2 className='text-base font-semibold text-slate-900'>Validate and Create Schema</h2>
        <Textarea rows={8} value={yaml} onChange={(e) => setYaml(e.target.value)} placeholder='Paste YAML schema content' />
        <div className='flex gap-2'>
          <Button type='button' onClick={async () => setValidation((await schemasApi.validate({ content: yaml })).errors)}>Validate</Button>
          <Button type='button' className='bg-emerald-700' onClick={() => createMutation.mutate({ content: yaml, sourceType: 'USER_DEFINED' })}>Create</Button>
        </div>
        {validation && (validation.length === 0 ? <p className='text-sm text-emerald-700'>Schema is valid.</p> : <Alert title='Schema validation errors' message={validation.join('; ')} />)}
      </div>
      <SchemaGenerationPanel onYamlReady={setYaml} />
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
    </section>
  )
}

function SchemaGenerationPanel({ onYamlReady }: { onYamlReady: (yaml: string) => void }) {
  const [name, setName] = useState('generated-schema')
  const [version, setVersion] = useState(1)
  const [text, setText] = useState('')
  const [userPrompt, setUserPrompt] = useState('')
  const [example, setExample] = useState('')
  const [error, setError] = useState<string | null>(null)

  const generateExample = async () => {
    setError(null)
    try {
      const res = await schemasApi.generateExample({ text, userPrompt })
      setExample(res.example)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const generateYaml = async () => {
    if (!example.trim()) {
      setError('Generate example first before YAML generation.')
      return
    }
    setError(null)
    try {
      const res = await schemasApi.generateYaml({ name, version, text, example })
      onYamlReady(res.content)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4'>
      <h2 className='text-base font-semibold text-slate-900'>Schema Generation</h2>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Schema name' />
      <Input type='number' value={version} onChange={(e) => setVersion(Number(e.target.value))} placeholder='Version' />
      <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder='Source text' />
      <Textarea rows={3} value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder='Optional generation guidance' />
      <Button type='button' onClick={generateExample}>Generate Example</Button>
      <Textarea rows={5} value={example} onChange={(e) => setExample(e.target.value)} placeholder='Generated example (editable)' />
      <Button type='button' className='bg-emerald-700' onClick={generateYaml}>Generate YAML</Button>
      {error && <Alert title='Generation failed' message={error} />}
    </div>
  )
}
