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
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

export function QueriesPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const [prompt, setPrompt] = useState('')
  const [cypher, setCypher] = useState('')
  const [parameters, setParameters] = useState('{}')
  const [parametersFormatError, setParametersFormatError] = useState<string | null>(null)

  const generate = useGenerateQueryMutation()
  const validate = useValidateQueryMutation()
  const execute = useExecuteQueryMutation()
  const ask = useAskQueryMutation()
  const isAnyPending = ask.isPending || generate.isPending || validate.isPending || execute.isPending

  const parseParametersForSubmit = () => {
    try {
      setParametersFormatError(null)
      return JSON.parse(parameters) as Record<string, unknown>
    } catch {
      setParametersFormatError('Cannot submit invalid JSON parameters.')
      return null
    }
  }

  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base before running query workflows.' tone='info' />
  }

  const topSection = (
    <div className='space-y-2'>
      <p className='text-sm text-slate-700'>Use tabs below to run endpoint workflows for query generation, validation, execution, and one-shot ask.</p>
      {isAnyPending ? <ProgressBanner message='Waiting for backend query response...' /> : null}
    </div>
  )

  const tabs: EndpointTab[] = [
    {
      id: 'ask-query',
      label: 'Ask query',
      content: (
        <div className='space-y-2'>
          <FieldLabel htmlFor='ask-query-prompt'>Question prompt</FieldLabel>
          <Textarea id='ask-query-prompt' rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
          <Button type='button' className='bg-slate-700' isPending={ask.isPending} pendingText='Asking...' onClick={() => ask.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })}>Ask</Button>
          {ask.error && <Alert title='Ask failed' message={(ask.error as Error).message} />}
          {ask.data && <OutputPreview label='Ask query result JSON' format='json'>{JSON.stringify(ask.data, null, 2)}</OutputPreview>}
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
            isPending={generate.isPending}
            pendingText='Generating...'
            onClick={async () => {
              try {
                const res = await generate.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })
                setCypher(res.cypher)
                setParameters(JSON.stringify(res.parameters ?? {}, null, 2))
              } catch {
                // surfaced via generate.error
              }
            }}
          >
            Generate Cypher
          </Button>
          {generate.error && <Alert title='Generate failed' message={(generate.error as Error).message} />}
          <FieldLabel htmlFor='generate-cypher-text'>Generated Cypher query</FieldLabel>
          <Textarea id='generate-cypher-text' rows={6} value={cypher} onChange={(e) => setCypher(e.target.value)} placeholder='Cypher query' />
          <FieldLabel htmlFor='generate-cypher-params'>Generated query parameters JSON</FieldLabel>
          <StructuredPayloadEditor
            id='generate-cypher-params'
            format='json'
            rows={4}
            value={parameters}
            onChange={setParameters}
            error={parametersFormatError}
            onErrorChange={setParametersFormatError}
            placeholder='JSON parameters'
          />
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
          <StructuredPayloadEditor
            id='validate-cypher-params'
            format='json'
            rows={4}
            value={parameters}
            onChange={setParameters}
            error={parametersFormatError}
            onErrorChange={setParametersFormatError}
            placeholder='JSON parameters'
          />
          <Button
            type='button'
            isPending={validate.isPending}
            pendingText='Validating...'
            onClick={() => {
              const parsedParams = parseParametersForSubmit()
              if (!parsedParams) return
              validate.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })
            }}
          >
            Validate
          </Button>
          {validate.error && <Alert title='Validation failed' message={(validate.error as Error).message} />}
          {validate.data && <OutputPreview label='Validation result JSON' format='json'>{JSON.stringify(validate.data, null, 2)}</OutputPreview>}
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
          <StructuredPayloadEditor
            id='execute-cypher-params'
            format='json'
            rows={4}
            value={parameters}
            onChange={setParameters}
            error={parametersFormatError}
            onErrorChange={setParametersFormatError}
            placeholder='JSON parameters'
          />
          <Button
            type='button'
            className='bg-emerald-700'
            isPending={execute.isPending}
            pendingText='Executing...'
            onClick={() => {
              const parsedParams = parseParametersForSubmit()
              if (!parsedParams) return
              execute.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { cypher, parameters: parsedParams } })
            }}
          >
            Execute
          </Button>
          {execute.error && <Alert title='Execution failed' message={(execute.error as Error).message} />}
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
      tabs={<EndpointTabs tabs={tabs} testId='queries-endpoint-tabs' disableTabSwitch={isAnyPending} keepPanelsMounted />}
      testId='queries-controller-page'
    />
  )
}
