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
          <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
          <Button type='button' className='bg-slate-700' onClick={() => ask.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })}>Ask</Button>
          {ask.data && <pre className='max-h-72 overflow-auto rounded-md border border-slate-300 bg-white p-3 text-xs'>{JSON.stringify(ask.data, null, 2)}</pre>}
        </div>
      ),
    },
    {
      id: 'generate-cypher',
      label: 'Generate Cypher',
      content: (
        <div className='space-y-2'>
          <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
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
          <Textarea rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <Textarea rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
        </div>
      ),
    },
    {
      id: 'validate-cypher',
      label: 'Validate Cypher',
      content: (
        <div className='space-y-2'>
          <Textarea rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <Textarea rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
          <Button type='button' onClick={() => validate.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })}>Validate</Button>
          {validate.data && <pre className='max-h-72 overflow-auto rounded-md border border-slate-300 bg-white p-3 text-xs'>{JSON.stringify(validate.data, null, 2)}</pre>}
        </div>
      ),
    },
    {
      id: 'execute-cypher',
      label: 'Execute Cypher',
      content: (
        <div className='space-y-2'>
          <Textarea rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <Textarea rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
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
