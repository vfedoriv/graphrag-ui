import { afterEach, describe, expect, it } from 'vitest'
import { chunkingApi } from './chunking'
import { documentsApi } from './documents'
import { queryKeys } from './queryKeys'
import { reprocessingPlansApi } from './reprocessingPlans'
import { jsonResponse, stubFetch } from '../test/helpers'

afterEach(() => vi.unstubAllGlobals())

describe('advanced operation routes and keys', () => {
  it('serializes authoritative chunk reads and migration operations exactly', async () => {
    const fetchMock = stubFetch((url) => jsonResponse(url.includes('/chunk-migrations/') ? 200 : 202, url.includes('/chunk-migrations/') ? { knowledgeBaseId: 'kb-1', selection: 'OUTDATED_STRATEGY', ready: true, blockers: [], target: null, classificationCounts: { noChunks: 0, outdated: 1, current: 2 }, selectedCount: 1, selectedDocuments: { page: 0, size: 20, totalElements: 1, content: [] } } : { planId: 'plan-1', status: 'QUEUED', statusLocation: '/plans/plan-1' }))
    await chunkingApi.state()
    await documentsApi.chunkHierarchy('doc-1', 1, 10)
    await documentsApi.chunkPage('doc-1', 2, 25, { kind: 'CHILD', parentChunkId: 'parent-1', sectionIndex: 3 })
    await documentsApi.chunk('doc-1', 'chunk-1')
    await reprocessingPlansApi.previewMigration('kb-1', { selection: 'OUTDATED_STRATEGY', documentIds: [], processingOptions: {} }, 3, 15)
    await reprocessingPlansApi.create('kb-1', { reason: 'CHUNK_STRATEGY_MIGRATION', selection: 'OUTDATED_STRATEGY', documentIds: ['must-be-omitted'] })
    await reprocessingPlansApi.retry('kb-1', 'plan-1')
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      '/api/v1/chunking-state',
      '/api/v1/documents/doc-1/chunks/hierarchy?page=1&size=10',
      '/api/v1/documents/doc-1/chunks/page?page=2&size=25&kind=CHILD&parentChunkId=parent-1&sectionIndex=3',
      '/api/v1/documents/doc-1/chunks/chunk-1',
      '/api/v1/knowledge-bases/kb-1/chunk-migrations/preview?page=3&size=15',
      '/api/v1/knowledge-bases/kb-1/reprocessing-plans',
      '/api/v1/knowledge-bases/kb-1/reprocessing-plans/plan-1/retry',
    ])
    expect(fetchMock.mock.calls[5][1]).toMatchObject({ body: JSON.stringify({ reason: 'CHUNK_STRATEGY_MIGRATION', selection: 'OUTDATED_STRATEGY' }) })
    expect(fetchMock.mock.calls[6][1]).toMatchObject({ body: JSON.stringify({ mode: 'RESNAPSHOT_UNRESOLVED' }) })
  })

  it('isolates filters and required identifiers in stable query keys', () => {
    expect(queryKeys.chunkPage('doc-1', 0, 20, 'PARENT', null, null)).not.toEqual(queryKeys.chunkPage('doc-1', 0, 20, 'CHILD', null, null))
    expect(queryKeys.reprocessingPlanHistoryFiltered('kb-1', { reason: 'SCHEMA_ACTIVATION', status: 'RUNNING' }, 0, 20)).not.toEqual(queryKeys.reprocessingPlanHistoryFiltered('kb-1', { reason: 'CHUNK_STRATEGY_MIGRATION', status: 'RUNNING' }, 0, 20))
    expect(queryKeys.advancedSearchHistory('kb-1', 'RUNNING', 0, 20)).not.toEqual(queryKeys.advancedSearchHistory('kb-2', 'RUNNING', 0, 20))
    expect(queryKeys.chunkDirectMaybe(null, 'chunk-1')).toEqual(['documents', 'chunks', 'none', 'direct', 'none'])
  })
})
