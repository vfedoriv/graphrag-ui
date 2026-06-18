import { useState } from 'react'
import {
  useAskQueryMutation,
  useExecuteQueryMutation,
  useGenerateQueryMutation,
  useHybridSearchMutation,
  useValidateQueryMutation,
} from '../../api/queries'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
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
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

function entityIdentifier(entity: HybridSearchGraphEntity) {
  return entity.id ?? entity.elementId ?? ''
}

function relationshipIdentifier(relationship: HybridSearchGraphRelationship) {
  return relationship.id ?? relationship.elementId ?? ''
}

function relationshipStartIdentifier(relationship: HybridSearchGraphRelationship) {
  return relationship.startNodeElementId ?? relationship.startEntityId ?? relationship.startElementId ?? ''
}

function relationshipEndIdentifier(relationship: HybridSearchGraphRelationship) {
  return relationship.endNodeElementId ?? relationship.endEntityId ?? relationship.endElementId ?? ''
}

function renderSourceMetadata(hit: HybridSearchHit) {
  const source = hit.source
  const filename = source.filename ?? source.originalFilename
  const metadata = source.metadata ?? source.chunkMetadata

  return (
    <dl className='grid two'>
      <div>
        <dt className='font-semibold'>Source document</dt>
        <dd>{source.documentId}</dd>
      </div>
      {filename ? (
        <div>
          <dt className='font-semibold'>Filename</dt>
          <dd>{filename}</dd>
        </div>
      ) : null}
      {source.contentType ? (
        <div>
          <dt className='font-semibold'>Content type</dt>
          <dd>{source.contentType}</dd>
        </div>
      ) : null}
      {source.sizeBytes ? (
        <div>
          <dt className='font-semibold'>Size</dt>
          <dd>{source.sizeBytes} bytes</dd>
        </div>
      ) : null}
      <div>
        <dt className='font-semibold'>Source metadata</dt>
        <dd>
          <OutputPreview label='Source metadata JSON' format='json'>{formatJson(metadata)}</OutputPreview>
        </dd>
      </div>
    </dl>
  )
}

function renderEntities(entities: HybridSearchGraphEntity[]) {
  if (entities.length === 0) {
    return <p>No graph entities returned for this hit.</p>
  }

  return (
    <Table
      headers={['Identifier', 'Labels', 'Properties']}
      rowKeys={entities.map((entity, index) => entityIdentifier(entity) || index)}
      rows={entities.map((entity) => [
        entityIdentifier(entity),
        entity.labels?.join(', ') ?? '',
        <OutputPreview label={`Entity ${entityIdentifier(entity)} properties JSON`} format='json'>{formatJson(entity.properties)}</OutputPreview>,
      ])}
    />
  )
}

function renderRelationships(relationships: HybridSearchGraphRelationship[]) {
  if (relationships.length === 0) {
    return <p>No graph relationships returned for this hit.</p>
  }

  return (
    <Table
      headers={['Identifier', 'Type', 'Start', 'End', 'Properties']}
      rowKeys={relationships.map((relationship, index) => relationshipIdentifier(relationship) || index)}
      rows={relationships.map((relationship) => [
        relationshipIdentifier(relationship),
        relationship.type,
        relationshipStartIdentifier(relationship),
        relationshipEndIdentifier(relationship),
        <OutputPreview label={`Relationship ${relationshipIdentifier(relationship)} properties JSON`} format='json'>{formatJson(relationship.properties)}</OutputPreview>,
      ])}
    />
  )
}

function getGraphContext(hit: HybridSearchHit) {
  const graph = hit.graph ?? hit.graphContext

  return {
    entities: graph?.entities ?? [],
    relationships: graph?.relationships ?? [],
  }
}

export function QueriesPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const activeKnowledgeBase = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId)
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
    <div className='stack'>
      <OperationSpine
        ariaLabel='Query workflow status'
        items={[
          { eyebrow: 'Workspace', title: selectedKnowledgeBaseId, body: 'All query operations run against this knowledge base.' },
          { eyebrow: 'Ask', title: ask.isPending ? 'Running' : 'Ready', body: 'One-shot natural language answer and evidence.' },
          { eyebrow: 'Cypher', title: generate.isPending || validate.isPending || execute.isPending ? 'Active' : 'Ready', body: 'Generate, validate, and execute editable Cypher.' },
          { eyebrow: 'Hybrid', title: hybridSearch.isPending ? 'Searching' : 'Ready', body: 'Vector hits with source and graph context.' },
        ]}
      />
      <p>Use tabs below to run endpoint workflows for query generation, validation, execution, one-shot ask, and hybrid search.</p>
      <RuntimeContextSummary
        knowledgeBaseId={selectedKnowledgeBaseId}
        settingHints={['query', 'safety', 'hybrid', 'search']}
        title='Query runtime context'
      />
      {isAnyPending ? <ProgressBanner message='Waiting for backend query response...' /> : null}
    </div>
  )

  const tabs: EndpointTab[] = [
    {
      id: 'ask-query',
      label: 'Ask query',
      content: (
        <div className='stack'>
          <FieldLabel htmlFor='ask-query-prompt'>Question prompt</FieldLabel>
          <Textarea id='ask-query-prompt' rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
          <Button type='button' variant='primary' isPending={ask.isPending} pendingText='Asking...' onClick={() => ask.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, prompt })}>Ask</Button>
          {ask.error && <Alert title='Ask failed' message={(ask.error as Error).message} />}
          {ask.data && <OutputPreview label='Ask query result JSON' format='json'>{JSON.stringify(ask.data, null, 2)}</OutputPreview>}
        </div>
      ),
    },
    {
      id: 'hybrid-search',
      label: 'Hybrid search',
      content: (
        <div className='stack'>
          <FieldLabel htmlFor='hybrid-search-query'>Search query</FieldLabel>
          <Textarea id='hybrid-search-query' rows={3} value={hybridQuery} onChange={(e) => setHybridQuery(e.target.value)} placeholder='Search in natural language' />
          <div className='grid two'>
            <div className='stack'>
              <FieldLabel htmlFor='hybrid-search-top-k'>Hit limit</FieldLabel>
              <Input id='hybrid-search-top-k' type='number' min={1} value={hybridTopK} onChange={(e) => setHybridTopK(e.target.value)} />
            </div>
            <div className='stack'>
              <FieldLabel htmlFor='hybrid-search-graph-depth'>Graph depth</FieldLabel>
              <Input id='hybrid-search-graph-depth' type='number' min={0} value={hybridGraphDepth} onChange={(e) => setHybridGraphDepth(e.target.value)} />
            </div>
          </div>
          <label htmlFor='hybrid-search-include-text' className='check-row'>
            <input
              id='hybrid-search-include-text'
              type='checkbox'
              checked={hybridIncludeChunkText}
              onChange={(e) => setHybridIncludeChunkText(e.target.checked)}
            />
            Include chunk text
          </label>
          <Button type='button' variant='primary' isPending={hybridSearch.isPending} pendingText='Searching...' onClick={submitHybridSearch}>Search</Button>
          {hybridValidationError ? <Alert title='Hybrid search options invalid' message={hybridValidationError} /> : null}
          {hybridSearch.error ? <Alert title='Hybrid search failed' message={(hybridSearch.error as Error).message} /> : null}
          {hybridSearch.data ? (
            <div className='stack-lg'>
              <div className='flow-card'>
                <h3>Hybrid search summary</h3>
                <dl className='grid three'>
                  <div>
                    <dt className='font-semibold'>Query</dt>
                    <dd>{hybridSearch.data.query}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold'>Applied topK</dt>
                    <dd>{hybridSearch.data.topK}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold'>Applied graphDepth</dt>
                    <dd>{hybridSearch.data.graphDepth}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold'>Include chunk text</dt>
                    <dd>{hybridSearch.data.includeChunkText ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold'>Hit count</dt>
                    <dd>{hybridSearch.data.hitCount}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold'>Execution time</dt>
                    <dd>{hybridSearch.data.executionTimeMs} ms</dd>
                  </div>
                </dl>
              </div>
              {hybridSearch.data.hits.length === 0 ? (
                <Alert title='No hybrid search hits' message='The search completed but returned no ranked chunk evidence.' tone='info' />
              ) : (
                <div className='stack'>
                  {hybridSearch.data.hits.map((hit, index) => {
                    const graphContext = getGraphContext(hit)

                    return (
                      <section key={hit.chunkId} className='flow-card'>
                        <h3>Rank {index + 1}: {hit.chunkId}</h3>
                        <dl className='grid three'>
                          <div>
                            <dt className='font-semibold'>Chunk id</dt>
                            <dd>{hit.chunkId}</dd>
                          </div>
                          <div>
                            <dt className='font-semibold'>Document id</dt>
                            <dd>{hit.documentId}</dd>
                          </div>
                          <div>
                            <dt className='font-semibold'>Chunk index</dt>
                            <dd>{hit.chunkIndex}</dd>
                          </div>
                          <div>
                            <dt className='font-semibold'>Score</dt>
                            <dd>{hit.score}</dd>
                          </div>
                        </dl>
                        <div className='stack'>
                          {renderSourceMetadata(hit)}
                          {hit.text ? <OutputPreview label='Chunk text'>{hit.text}</OutputPreview> : null}
                          <div className='stack'>
                            <h4>Graph entities</h4>
                            {renderEntities(graphContext.entities)}
                          </div>
                          <div className='stack'>
                            <h4>Graph relationships</h4>
                            {renderRelationships(graphContext.relationships)}
                          </div>
                        </div>
                      </section>
                    )
                  })}
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
        <div className='stack'>
          <FieldLabel htmlFor='generate-cypher-prompt'>Question prompt</FieldLabel>
          <Textarea id='generate-cypher-prompt' rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder='Ask in natural language' />
          <Button
            type='button'
            variant='primary'
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
        <div className='stack'>
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
            variant='primary'
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
        <div className='stack'>
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
            variant='primary'
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
  const orderedTabs = [tabs[0], tabs[2], tabs[3], tabs[4], tabs[1]].filter(Boolean)

  return (
    <ControllerPage
      title='Queries'
      eyebrow='Endpoint tabs'
      description='Query workflows stay tabbed because each workflow maps to a distinct endpoint operation.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Workspace', value: selectedKnowledgeBaseId },
            { label: 'Active AI profile', value: activeKnowledgeBase?.activeAiProfileId ?? 'None assigned', tone: activeKnowledgeBase?.activeAiProfileId ? 'success' : 'warning' },
            { label: 'Pending', value: isAnyPending ? 'Request running' : 'Idle', tone: isAnyPending ? 'warning' : 'neutral' },
          ]}
        />
      }
      topSectionTitle='Query controller overview'
      topSection={topSection}
      tabs={<EndpointTabs tabs={orderedTabs} testId='queries-endpoint-tabs' disableTabSwitch={isAnyPending} keepPanelsMounted />}
      tabsTitle='Endpoint workflow console'
      tabsDescription='Ask, generate Cypher, validate Cypher, execute Cypher, and hybrid search remain separate request flows.'
      tabsStatus={<StatusBadge label={isAnyPending ? 'Request running' : 'Idle'} tone={isAnyPending ? 'warning' : 'neutral'} />}
      testId='queries-controller-page'
    />
  )
}
