import { useState } from 'react'
import {
  useAskQueryMutation,
  useExecuteQueryMutation,
  useGenerateQueryMutation,
  useValidateQueryMutation,
} from '../../api/queries'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { type EndpointTab, EndpointTabs } from '../../shared/ui/EndpointTabs'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

export function QueriesPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const [prompt, setPrompt] = useState('')
  const [cypher, setCypher] = useState('')
  const [parameters, setParameters] = useState('{}')

  const generate = useGenerateQueryMutation()
  const validate = useValidateQueryMutation()
  const execute = useExecuteQueryMutation()
  const ask = useAskQueryMutation()

  const parsedParams = (() => {
    try {
      return JSON.parse(parameters) as Record<string, unknown>
    } catch {
      return {}
    }
  })()

  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base before running query workflows.' tone='info' />
  }

  const topSection = (
    <p className='text-sm text-slate-700'>Use tabs below to run endpoint workflows for query generation, validation, execution, and one-shot ask.</p>
  )

  const tabs: EndpointTab[] = [
    {
      id: 'ask-query',
      label: 'Ask query',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='ask-query-prompt'>Question prompt</FieldLabel>
          <Textarea id='ask-query-prompt' rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
          <Button type='button' className='bg-slate-700' onClick={() => ask.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })}>Ask</Button>
          {ask.data && <OutputPreview label='Ask query result JSON'>{JSON.stringify(ask.data, null, 2)}</OutputPreview>}
        </div>
      ),
    },
    {
      id: 'generate-cypher',
      label: 'Generate Cypher',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='generate-cypher-prompt'>Question prompt</FieldLabel>
          <Textarea id='generate-cypher-prompt' rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
          <Button
            type='button'
            onClick={async () => {
              const res = await generate.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })
              setCypher(res.cypher)
              setParameters(JSON.stringify(res.parameters ?? {}, null, 2))
            }}
          >
            Generate Cypher
          </Button>
          <FieldLabel htmlFor='generate-cypher-text'>Generated Cypher query</FieldLabel>
          <Textarea id='generate-cypher-text' rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <FieldLabel htmlFor='generate-cypher-params'>Generated query parameters JSON</FieldLabel>
          <Textarea id='generate-cypher-params' rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
        </div>
      ),
    },
    {
      id: 'validate-cypher',
      label: 'Validate Cypher',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='validate-cypher-text'>Cypher query</FieldLabel>
          <Textarea id='validate-cypher-text' rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <FieldLabel htmlFor='validate-cypher-params'>Query parameters JSON</FieldLabel>
          <Textarea id='validate-cypher-params' rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
          <Button type='button' onClick={() => validate.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })}>Validate</Button>
          {validate.data && <OutputPreview label='Validation result JSON'>{JSON.stringify(validate.data, null, 2)}</OutputPreview>}
        </div>
      ),
    },
    {
      id: 'execute-cypher',
      label: 'Execute Cypher',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='execute-cypher-text'>Cypher query</FieldLabel>
          <Textarea id='execute-cypher-text' rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <FieldLabel htmlFor='execute-cypher-params'>Query parameters JSON</FieldLabel>
          <Textarea id='execute-cypher-params' rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
          <Button type='button' className='bg-emerald-700' onClick={() => execute.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })}>Execute</Button>
          {execute.data && (
            <Table
              headers={execute.data.columns}
              rows={execute.data.rows.map((row) => execute.data.columns.map((col) => String(row[col] ?? '')))}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <ControllerPage
      title='Queries'
      topSectionTitle='Query controller overview'
      topSection={topSection}
      tabs={<EndpointTabs tabs={tabs} testId='queries-endpoint-tabs' />}
      testId='queries-controller-page'
    />
  )
}
