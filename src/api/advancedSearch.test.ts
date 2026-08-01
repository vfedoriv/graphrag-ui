import { describe, expect, it, afterEach } from 'vitest'
import {
  advancedSearchApi,
  canFetchAdvancedSearchResult,
  parseAdvancedSearchResult,
  serializeAdvancedSearchRequest,
} from './advancedSearch'
import { jsonResponse, stubFetch } from '../test/helpers'

afterEach(() => vi.unstubAllGlobals())

const diagnostics = {
  plan: { version: 1, promptRevision: 'p1', subquestionCount: 1, exactTermCount: 0, graphRequestCount: 0, metadataConstrained: false, fallbackUsed: false, fallbackCategory: null },
  sufficiency: { version: 1, promptRevision: 'p1', completeCoverageCount: 1, partialCoverageCount: 0, missingCoverageCount: 0, contradictionCount: 0, concreteGap: false, refinementCount: 0, fallbackUsed: false, fallbackCategory: null },
  followUp: { executed: false, queryCount: 0, skippedCategory: 'NOT_NEEDED' },
  attempts: [],
  fusion: { acceptedByChannel: {}, truncatedByChannel: {}, executedSubqueries: {}, deduplicatedCandidateCount: 0, poolTruncatedCount: 0, graphDerivedCandidateCount: 0 },
  graphExpansion: { seedCount: 0, sourceRowCount: 0, attachedFactCount: 0 },
  parentContext: { evidenceConsidered: 0, contextCount: 0, tokenEstimate: 0, outcomes: {} },
  rerank: { poolSize: 0, fallbackUsed: false, fallbackCategory: null },
  selection: { requestedMaximum: 5, effectivePerDocumentCap: 5, comparisonPolicy: false, skippedForDiversity: 0, selectedByDocument: {} },
  sourceMetadata: { warnings: [] },
}

const result = {
  runId: 'run-1', payloadVersion: 1,
  result: {
    payloadVersion: 1,
    answer: { version: 1, status: 'ANSWERED', text: 'Answer', confidence: { level: 'HIGH', score: 0.9 }, limitations: [], claims: [{ id: 'C1', kind: 'TEXT', text: 'Answer', citationIds: ['E1'], graphFactIds: [], graphEvidenceIds: [] }] },
    evidence: [{ citationId: 'E1', type: 'TEXT_CHILD', chunkId: 'chunk-1', documentId: 'doc-1', range: { sourceStart: null, sourceEnd: null, pageStart: null, pageEnd: null }, processingRunId: null, effectiveChunkerRevision: null, structuralPath: null, text: null, rank: 1, score: null, sourceFilename: null, sourceContentType: null, sourceDisplayLabel: null }],
    contexts: [], graphFacts: [],
    answerDiagnostics: { repairAttempted: false, repairSucceeded: false, abstained: false, citationCount: 1, claimCount: 1, outcomeCategory: 'ANSWERED' },
    diagnostics,
  },
  createdAt: '2026-08-02T00:00:00Z',
}

describe('advanced search API contracts', () => {
  it('serializes evidence controls with the documented names and defaults', () => {
    expect(serializeAdvancedSearchRequest({ query: 'renewal', maximumEvidence: 10, includeEvidenceText: false })).toEqual({ query: 'renewal', maximumEvidence: 10, includeEvidenceText: false })
    expect(serializeAdvancedSearchRequest({ query: 'renewal', maximumEvidence: '  ', includeEvidenceText: undefined })).toEqual({ query: 'renewal', includeEvidenceText: true })
  })

  it('uses the owned run routes and preserves nullable legacy evidence metadata', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/readiness')) return jsonResponse(200, { knowledgeBaseId: 'kb-1', ready: true, profileId: 'p1', profileRevision: 2, graphBranchAvailable: false, embeddedCorpusPresent: true, blockers: [], informational: [] })
      if (url.endsWith('/result')) return jsonResponse(200, result)
      return jsonResponse(200, { id: 'run-1', knowledgeBaseId: 'kb-1', query: 'renewal', maximumEvidence: 10, includeEvidenceText: true, status: 'COMPLETED', stage: 'TERMINAL', completedBranches: 1, totalBranches: 1, evidenceCount: 1, cancellationRequested: false, failureCategory: null, links: {} })
    })
    await advancedSearchApi.readiness('kb-1')
    await advancedSearchApi.create('kb-1', { query: 'renewal', maximumEvidence: '', includeEvidenceText: true })
    await advancedSearchApi.history('kb-1', 'RUNNING', 2, 5)
    const parsed = await advancedSearchApi.result('kb-1', 'run-1')
    await advancedSearchApi.cancel('kb-1', 'run-1')
    expect(parsed.kind).toBe('VALID')
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      '/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs/readiness',
      '/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs',
      '/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs?status=RUNNING&page=2&size=5',
      '/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs/run-1/result',
      '/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs/run-1/cancel',
    ])
    expect((parsed.kind === 'VALID' ? parsed.result.evidence[0] : null)?.sourceDisplayLabel).toBeNull()
    expect(fetchMock.mock.calls[4][1]).toMatchObject({ method: 'POST' })
  })

  it('retains raw diagnostics for mismatched versions and malformed version-one payloads', () => {
    const mismatch = parseAdvancedSearchResult({ ...result, payloadVersion: 2 })
    expect(mismatch).toMatchObject({ kind: 'UNSUPPORTED_VERSION', raw: { runId: 'run-1' }, payloadVersion: 2, nestedPayloadVersion: 1 })
    const malformed = parseAdvancedSearchResult({ ...result, result: { ...result.result, answer: undefined } })
    expect(malformed).toMatchObject({ kind: 'MALFORMED', raw: { runId: 'run-1' } })
    expect(canFetchAdvancedSearchResult('COMPLETED')).toBe(true)
    expect(canFetchAdvancedSearchResult('FAILED')).toBe(false)
  })
})
