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

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Queries</h1>
      {!selectedKnowledgeBaseId && (
        <Alert
          title='No knowledge base selected'
          message='Select a knowledge base before running query workflows.'
          tone='info'
        />
      )}
      {selectedKnowledgeBaseId && (
        <>
      <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4'>
        <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
        <div className='flex flex-wrap gap-2'>
          <Button type='button' onClick={async () => {
            const res = await generate.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })
            setCypher(res.cypher)
            setParameters(JSON.stringify(res.parameters ?? {}, null, 2))
          }}>Generate Cypher</Button>
          <Button type='button' className='bg-slate-700' onClick={() => ask.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })}>Ask</Button>
        </div>
      </div>

      <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4'>
        <Textarea rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
        <Textarea rows={4} value={parameters} onChange={(e) => setParameters(e.target.value)} placeholder='JSON parameters' />
        <div className='flex gap-2'>
          <Button type='button' onClick={() => validate.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })}>Validate</Button>
          <Button type='button' className='bg-emerald-700' onClick={() => execute.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })}>Execute</Button>
        </div>
      </div>

      {validate.data && <pre className='max-h-72 overflow-auto rounded-md border border-slate-300 bg-white p-3 text-xs'>{JSON.stringify(validate.data, null, 2)}</pre>}
      {ask.data && <pre className='max-h-72 overflow-auto rounded-md border border-slate-300 bg-white p-3 text-xs'>{JSON.stringify(ask.data, null, 2)}</pre>}
      {execute.data && (
        <Table
          headers={execute.data.columns}
          rows={execute.data.rows.map((row) => execute.data.columns.map((col) => String(row[col] ?? '')))}
        />
      )}
        </>
      )}
    </section>
  )
}
