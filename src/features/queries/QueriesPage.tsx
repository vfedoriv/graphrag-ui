import { useState } from 'react'
import {
  useAskQueryMutation,
  useExecuteQueryMutation,
  useGenerateQueryMutation,
  useHybridSearchMutation,
  useValidateQueryMutation,
} from '../../api/queries'
import type { HybridSearchGraphEntity, HybridSearchGraphRelationship, HybridSearchHit } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { type EndpointTab, EndpointTabs } from '../../shared/ui/EndpointTabs'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { Input } from '../../shared/ui/Input'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

function renderSourceMetadata(hit: HybridSearchHit) {
  const source = hit.source

  return (
    <dl className='grid gap-2 text-sm sm:grid-cols-2'>
      <div>
        <dt className='font-semibold text-slate-800'>Source document</dt>
        <dd className='text-slate-700'>{source.documentId}</dd>
      </div>
      {source.filename ? (
        <div>
          <dt className='font-semibold text-slate-800'>Filename</dt>
          <dd className='text-slate-700'>{source.filename}</dd>
        </div>
      ) : null}
      {source.contentType ? (
        <div>
          <dt className='font-semibold text-slate-800'>Content type</dt>
          <dd className='text-slate-700'>{source.contentType}</dd>
        </div>
      ) : null}
      <div className='sm:col-span-2'>
        <dt className='font-semibold text-slate-800'>Source metadata</dt>
        <dd>
          <OutputPreview label='Source metadata JSON' format='json'>{formatJson(source.metadata)}</OutputPreview>
        </dd>
      </div>
    </dl>
  )
}

function renderEntities(entities: HybridSearchGraphEntity[]) {
  if (entities.length === 0) {
    return <p className='text-sm text-slate-600'>No graph entities returned for this hit.</p>
  }

  return (
    <Table
      headers={['Identifier', 'Type', 'Labels', 'Properties']}
      rowKeys={entities.map((entity) => entity.id)}
      rows={entities.map((entity) => [
        entity.id,
        entity.type ?? '',
        entity.labels?.join(', ') ?? '',
        <OutputPreview label={`Entity ${entity.id} properties JSON`} format='json'>{formatJson(entity.properties)}</OutputPreview>,
      ])}
    />
  )
}

function renderRelationships(relationships: HybridSearchGraphRelationship[]) {
  if (relationships.length === 0) {
    return <p className='text-sm text-slate-600'>No graph relationships returned for this hit.</p>
  }

  return (
    <Table
      headers={['Identifier', 'Type', 'Start', 'End', 'Properties']}
      rowKeys={relationships.map((relationship) => relationship.id)}
      rows={relationships.map((relationship) => [
        relationship.id,
        relationship.type,
        relationship.startEntityId,
        relationship.endEntityId,
        <OutputPreview label={`Relationship ${relationship.id} properties JSON`} format='json'>{formatJson(relationship.properties)}</OutputPreview>,
      ])}
    />
  )
}

export function QueriesPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const [prompt, setPrompt] = useState('')
  const [cypher, setCypher] = useState('')
  const [parameters, setParameters] = useState('{}')
  const [parametersFormatError, setParametersFormatError] = useState<string | null>(null)
  const [hybridQuery, setHybridQuery] = useState('')
  const [hybridTopK, setHybridTopK] = useState('5')
  const [hybridGraphDepth, setHybridGraphDepth] = useState('1')
  const [hybridIncludeChunkText, setHybridIncludeChunkText] = useState(true)
  const [hybridValidationError, setHybridValidationError] = useState<string | null>(null)

  const generate = useGenerateQueryMutation()
  const validate = useValidateQueryMutation()
  const execute = useExecuteQueryMutation()
  const ask = useAskQueryMutation()
  const hybridSearch = useHybridSearchMutation()
  const isAnyPending = ask.isPending || generate.isPending || validate.isPending || execute.isPending || hybridSearch.isPending

  const parseParametersForSubmit = () => {
    try {
      setParametersFormatError(null)
      return JSON.parse(parameters) as Record<string, unknown>
    } catch {
      setParametersFormatError('Cannot submit invalid JSON parameters.')
      return null
    }
  }

  const submitHybridSearch = () => {
    if (!selectedKnowledgeBaseId) return

    const topK = Number(hybridTopK)
    const graphDepth = Number(hybridGraphDepth)

    if (!Number.isFinite(topK) || topK < 1) {
      setHybridValidationError('Hit limit must be at least 1.')
      return
    }
    if (!Number.isFinite(graphDepth) || graphDepth < 0) {
      setHybridValidationError('Graph depth must be 0 or greater.')
      return
    }

    setHybridValidationError(null)
    hybridSearch.mutate({
      knowledgeBaseId: selectedKnowledgeBaseId,
      payload: {
        query: hybridQuery,
        topK,
        graphDepth,
        includeChunkText: hybridIncludeChunkText,
      },
    })
  }

  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base before running query workflows.' tone='info' />
  }

  const topSection = (
    <div className='space-y-2'>
      <p className='text-sm text-slate-700'>Use tabs below to run endpoint workflows for query generation, validation, execution, one-shot ask, and hybrid search.</p>
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
      id: 'hybrid-search',
      label: 'Hybrid search',
      content: (
        <div className='space-y-3'>
          <FieldLabel htmlFor='hybrid-search-query'>Search query</FieldLabel>
          <Textarea id='hybrid-search-query' rows={3} value={hybridQuery} onChange={(e) => setHybridQuery(e.target.value)} placeholder='Search in natural language' />
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <FieldLabel htmlFor='hybrid-search-top-k'>Hit limit</FieldLabel>
              <Input id='hybrid-search-top-k' type='number' min={1} value={hybridTopK} onChange={(e) => setHybridTopK(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <FieldLabel htmlFor='hybrid-search-graph-depth'>Graph depth</FieldLabel>
              <Input id='hybrid-search-graph-depth' type='number' min={0} value={hybridGraphDepth} onChange={(e) => setHybridGraphDepth(e.target.value)} />
            </div>
          </div>
          <label htmlFor='hybrid-search-include-text' className='flex items-center gap-2 text-sm font-medium text-slate-800'>
            <input
              id='hybrid-search-include-text'
              type='checkbox'
              checked={hybridIncludeChunkText}
              onChange={(e) => setHybridIncludeChunkText(e.target.checked)}
              className='h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500'
            />
            Include chunk text
          </label>
          <Button type='button' className='bg-emerald-700' isPending={hybridSearch.isPending} pendingText='Searching...' onClick={submitHybridSearch}>Search</Button>
          {hybridValidationError ? <Alert title='Hybrid search options invalid' message={hybridValidationError} /> : null}
          {hybridSearch.error ? <Alert title='Hybrid search failed' message={(hybridSearch.error as Error).message} /> : null}
          {hybridSearch.data ? (
            <div className='space-y-4'>
              <div className='rounded-md border border-slate-300 bg-white p-3'>
                <h3 className='mb-3 text-sm font-semibold text-slate-900'>Hybrid search summary</h3>
                <dl className='grid gap-2 text-sm sm:grid-cols-3'>
                  <div>
                    <dt className='font-semibold text-slate-800'>Query</dt>
                    <dd className='text-slate-700'>{hybridSearch.data.query}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold text-slate-800'>Applied topK</dt>
                    <dd className='text-slate-700'>{hybridSearch.data.topK}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold text-slate-800'>Applied graphDepth</dt>
                    <dd className='text-slate-700'>{hybridSearch.data.graphDepth}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold text-slate-800'>Include chunk text</dt>
                    <dd className='text-slate-700'>{hybridSearch.data.includeChunkText ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold text-slate-800'>Hit count</dt>
                    <dd className='text-slate-700'>{hybridSearch.data.hitCount}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold text-slate-800'>Execution time</dt>
                    <dd className='text-slate-700'>{hybridSearch.data.executionTimeMs} ms</dd>
                  </div>
                </dl>
              </div>
              {hybridSearch.data.hits.length === 0 ? (
                <Alert title='No hybrid search hits' message='The search completed but returned no ranked chunk evidence.' tone='info' />
              ) : (
                <div className='space-y-3'>
                  {hybridSearch.data.hits.map((hit, index) => (
                    <section key={hit.chunkId} className='rounded-md border border-slate-300 bg-white p-3'>
                      <h3 className='text-sm font-semibold text-slate-900'>Rank {index + 1}: {hit.chunkId}</h3>
                      <dl className='mt-3 grid gap-2 text-sm sm:grid-cols-4'>
                        <div>
                          <dt className='font-semibold text-slate-800'>Chunk id</dt>
                          <dd className='text-slate-700'>{hit.chunkId}</dd>
                        </div>
                        <div>
                          <dt className='font-semibold text-slate-800'>Document id</dt>
                          <dd className='text-slate-700'>{hit.documentId}</dd>
                        </div>
                        <div>
                          <dt className='font-semibold text-slate-800'>Chunk index</dt>
                          <dd className='text-slate-700'>{hit.chunkIndex}</dd>
                        </div>
                        <div>
                          <dt className='font-semibold text-slate-800'>Score</dt>
                          <dd className='text-slate-700'>{hit.score}</dd>
                        </div>
                      </dl>
                      <div className='mt-3 space-y-3'>
                        {renderSourceMetadata(hit)}
                        {hit.text ? <OutputPreview label='Chunk text'>{hit.text}</OutputPreview> : null}
                        <div className='space-y-2'>
                          <h4 className='text-sm font-semibold text-slate-900'>Graph entities</h4>
                          {renderEntities(hit.graphContext.entities)}
                        </div>
                        <div className='space-y-2'>
                          <h4 className='text-sm font-semibold text-slate-900'>Graph relationships</h4>
                          {renderRelationships(hit.graphContext.relationships)}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          ) : null}
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
