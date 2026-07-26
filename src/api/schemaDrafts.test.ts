import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { loadAllSchemaDraftCandidates, schemaDraftsApi, useSchemaDraftWorkflowMutations } from './schemaDrafts'
import { ApiError } from './types'
import { queryKeys } from './queryKeys'
import { analysisDetailFixture, analysisHistoryFixture, baseSchemaDiffFixture, candidatePageFixture, draftFixture, legacyAnalysisDetailFixture, legacyAnalysisHistoryFixture, rolloutCompatibleDiffFixture, validationProblemFixture } from '../features/schema-drafts/schemaDraftFixtures'
import { isTerminalAnalysisStatus, type ConflictResponse } from '../features/schema-drafts/schemaDraftTypes'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

afterEach(() => vi.restoreAllMocks())

const conflictResponseFixture: ConflictResponse = {
  id: 'conflict-1',
  type: 'PROPERTY_TYPE',
  coordinate: 'Customer.age',
  alternatives: ['STRING', 'INTEGER'],
  evidence: [],
  resolved: false,
  selectedAlternative: null,
  customResolution: null,
  aggregateRevisionId: 'aggregate-1',
  current: true,
  createdAt: '2026-07-15T08:03:00Z',
  resolvedAt: null,
}

describe('schemaDraftsApi', () => {
  it('sends canonical guidance JSON for lifecycle mutations', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, draftFixture))
    await schemaDraftsApi.create('kb-1', { targetName: 'Support', targetVersion: 2, baseSchemaId: 'schema-1', guidance: draftFixture.guidance })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/knowledge-bases/kb-1/schema-drafts', expect.objectContaining({ method: 'POST', body: JSON.stringify({ targetName: 'Support', targetVersion: 2, baseSchemaId: 'schema-1', guidance: draftFixture.guidance }) }))
  })

  it('uses revision query parameters and multipart file bodies', async () => {
    const source = { id: 'source-1', type: 'FILE', status: 'ACTIVE', revision: 1, documentId: null, name: 'sample.txt', contentType: 'text/plain', sizeBytes: 4, sha256: 'sha', analyzed: false, createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T08:00:00Z' }
    const fetchMock = stubFetch(() => jsonResponse(200, source))
    const file = new File(['text'], 'sample.txt', { type: 'text/plain' })
    await schemaDraftsApi.addFileSource('kb-1', 'draft-1', 7, file)
    expect(fetchMock.mock.calls[0][0]).toContain('/sources/files?revision=7')
    expect(fetchMock.mock.calls[0][1]?.body).toBeInstanceOf(FormData)
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get('file')).toBe(file)
  })

  it('accepts current analysis contracts and nested outcome pages', async () => {
    stubFetch((url) => jsonResponse(200, url.includes('run-partial') ? analysisDetailFixture : analysisHistoryFixture))
    const history = await schemaDraftsApi.analysisHistory('kb-1', 'draft-1')
    const detail = await schemaDraftsApi.analysisRun('kb-1', 'draft-1', 'run-partial')
    expect(history.content).toHaveLength(4)
    expect(detail.sourceOutcomes.totalElements).toBe(3)
    expect(detail.sourceOutcomes.content[0].reused).toBe(true)
    expect(detail.effectiveSourceConcurrency).toBe(4)
    expect(detail.canRetry).toBe(true)
    expect(detail.sourceOutcomes.content[1].failureCode).toBe('SOURCE_DEADLINE_EXCEEDED')
  })

  it('accepts legacy null analysis metadata', async () => {
    stubFetch((url) => jsonResponse(200, url.includes('run-legacy') ? legacyAnalysisDetailFixture : legacyAnalysisHistoryFixture))
    await expect(schemaDraftsApi.analysisHistory('kb-1', 'draft-1')).resolves.toEqual(legacyAnalysisHistoryFixture)
    await expect(schemaDraftsApi.analysisRun('kb-1', 'draft-1', 'run-legacy')).resolves.toEqual(legacyAnalysisDetailFixture)
  })

  it('keeps expanded analysis contracts strict', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, { ...analysisDetailFixture, unrelated: true }))
    await expect(schemaDraftsApi.analysisRun('kb-1', 'draft-1', 'run-partial')).rejects.toMatchObject({ message: 'Analysis run response has unexpected shape' })
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, {
      ...analysisDetailFixture,
      sourceOutcomes: {
        ...analysisDetailFixture.sourceOutcomes,
        content: [{ ...analysisDetailFixture.sourceOutcomes.content[0], unrelated: true }],
      },
    })))
    await expect(schemaDraftsApi.analysisRun('kb-1', 'draft-1', 'run-partial')).rejects.toMatchObject({ message: 'Analysis run response has unexpected shape' })
  })

  it('accepts expanded and rollout-compatible compatibility diff responses', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, baseSchemaDiffFixture))
    await expect(schemaDraftsApi.diff('kb-1', 'draft-1')).resolves.toEqual(baseSchemaDiffFixture)
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, rolloutCompatibleDiffFixture)))
    await expect(schemaDraftsApi.diff('kb-1', 'draft-1')).resolves.toEqual(rolloutCompatibleDiffFixture)
  })

  it('keeps expanded compatibility diff objects strict at both levels', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, { ...baseSchemaDiffFixture, unrelated: true }))
    await expect(schemaDraftsApi.diff('kb-1', 'draft-1')).rejects.toMatchObject({ message: 'Compatibility diff response has unexpected shape' })
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, {
      ...baseSchemaDiffFixture,
      baseline: { ...baseSchemaDiffFixture.baseline, unrelated: true },
    })))
    await expect(schemaDraftsApi.diff('kb-1', 'draft-1')).rejects.toMatchObject({ message: 'Compatibility diff response has unexpected shape' })
  })

  it('rejects removed parallel candidate count fields', async () => {
    stubFetch(() => jsonResponse(200, { ...candidatePageFixture, candidateCount: 1 }))
    await expect(schemaDraftsApi.candidates('kb-1', 'draft-1')).rejects.toMatchObject({ status: 200, message: 'Candidate page response has unexpected shape' })
  })

  it('keeps recommendation and persistent review state independent', async () => {
    stubFetch(() => jsonResponse(200, candidatePageFixture))
    const page = await schemaDraftsApi.candidates('kb-1', 'draft-1')
    expect(page.content[0]).toMatchObject({ recommendationState: 'RECOMMENDED', effectiveReviewState: 'PINNED', latestDecisionId: 'decision-4' })
  })

  it('accepts conflict lineage fields from the default current scope', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, [conflictResponseFixture]))

    await expect(schemaDraftsApi.conflicts('kb-1', 'draft-1')).resolves.toEqual([conflictResponseFixture])
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/knowledge-bases/kb-1/schema-drafts/draft-1/conflicts')
  })

  it('accepts conflict lineage fields after successful resolution', async () => {
    const resolvedConflict = {
      ...conflictResponseFixture,
      resolved: true,
      selectedAlternative: 'INTEGER',
      resolvedAt: '2026-07-15T09:00:00Z',
    }
    const fetchMock = stubFetch(() => jsonResponse(200, resolvedConflict))

    await expect(schemaDraftsApi.resolveConflict('kb-1', 'draft-1', 'conflict-1', { revision: 7, selectedAlternative: 'INTEGER' })).resolves.toEqual(resolvedConflict)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/knowledge-bases/kb-1/schema-drafts/draft-1/conflicts/conflict-1/resolution',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ revision: 7, selectedAlternative: 'INTEGER' }) }),
    )
  })

  it('accepts candidates that have not received a persistent review decision', async () => {
    const unreviewed = {
      ...candidatePageFixture,
      content: candidatePageFixture.content.map((candidate) => ({
        ...candidate,
        effectiveReviewState: null,
        latestDecisionId: null,
      })),
    }
    stubFetch(() => jsonResponse(200, unreviewed))

    const page = await schemaDraftsApi.candidates('kb-1', 'draft-1')

    expect(page.content[0]).toMatchObject({ effectiveReviewState: null, latestDecisionId: null })
  })

  it('loads a single complete candidate page without extra requests', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, candidatePageFixture))

    await expect(loadAllSchemaDraftCandidates('kb-1', 'draft-1')).resolves.toEqual(candidatePageFixture.content)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/candidates?page=0&size=50')
  })

  it('combines all candidate pages including parent and child data split across boundaries', async () => {
    const node = { ...candidatePageFixture.content[0], kind: 'NODE', identity: 'node:Customer', label: 'Customer', property: null }
    const property = { ...candidatePageFixture.content[0], identity: 'node-property:Customer:customerId' }
    const relationship = { ...candidatePageFixture.content[0], kind: 'RELATIONSHIP', identity: 'relationship:Customer:OWNS:Account', label: null, property: null, relationshipType: 'OWNS', fromLabel: 'Customer', toLabel: 'Account' }
    const fetchMock = stubFetch((url) => {
      const page = Number(new URL(url, 'http://test').searchParams.get('page'))
      const content = page === 0 ? [node] : page === 1 ? [property] : [relationship]
      return jsonResponse(200, { page, size: 1, totalElements: 3, content })
    })

    await expect(loadAllSchemaDraftCandidates('kb-1', 'draft-1')).resolves.toEqual([node, property, relationship])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(expect.arrayContaining([
      expect.stringContaining('page=0&size=50'),
      expect.stringContaining('page=1&size=1'),
      expect.stringContaining('page=2&size=1'),
    ]))
  })

  it('loads an empty candidate result without requesting more pages', async () => {
    const fetchMock = stubFetch(() => jsonResponse(200, { page: 0, size: 50, totalElements: 0, content: [] }))

    await expect(loadAllSchemaDraftCandidates('kb-1', 'draft-1')).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects the complete candidate query when any remaining page fails', async () => {
    stubFetch((url) => {
      const page = Number(new URL(url, 'http://test').searchParams.get('page'))
      if (page === 1) return jsonResponse(500, { title: 'Candidate page failed', status: 500 })
      return jsonResponse(200, { page, size: 1, totalElements: 2, content: [candidatePageFixture.content[0]] })
    })

    await expect(loadAllSchemaDraftCandidates('kb-1', 'draft-1')).rejects.toMatchObject({ status: 500 })
  })

  it('normalizes validation and stale-revision problem details', async () => {
    stubFetch(() => jsonResponse(409, { ...validationProblemFixture, status: 409, title: 'Revision conflict', detail: 'Expected revision 8' }))
    const error = await schemaDraftsApi.update('kb-1', 'draft-1', { revision: 7, targetName: 'Support', targetVersion: 3 }).catch((value: unknown) => value)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'Expected revision 8', fieldErrors: { 'guidance.guidance.requiredConcepts[0].name': ['must not be blank'] } })
  })

  it('identifies every polling terminal state', () => {
    expect(isTerminalAnalysisStatus('RUNNING')).toBe(false)
    expect(['COMPLETED', 'PARTIAL', 'FAILED'].every((status) => isTerminalAnalysisStatus(status as 'COMPLETED'))).toBe(true)
  })

  it('refreshes draft, history, and selected analysis after retry success', async () => {
    stubFetch(() => jsonResponse(202, { runId: 'run-retry', status: 'RUNNING', statusLocation: '/runs/run-retry' }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
    const { result } = renderHook(useSchemaDraftWorkflowMutations, { wrapper })

    await act(() => result.current.retryAnalysis.mutateAsync({ knowledgeBaseId: 'kb-1', draftId: 'draft-1', runId: 'run-partial', revision: 7 }))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.schemaDraft('kb-1', 'draft-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schema-drafts', 'kb-1', 'draft-1'] })
  })

  it.each([400, 409])('refreshes authoritative analysis state after a %s retry rejection', async (status) => {
    stubFetch(() => jsonResponse(status, { status, title: 'Retry rejected', detail: 'Retry eligibility changed' }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
    const { result } = renderHook(useSchemaDraftWorkflowMutations, { wrapper })

    await act(async () => {
      await expect(result.current.retryAnalysis.mutateAsync({ knowledgeBaseId: 'kb-1', draftId: 'draft-1', runId: 'run-partial', revision: 7 })).rejects.toMatchObject({ status, message: 'Retry eligibility changed' })
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.schemaDraft('kb-1', 'draft-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schema-drafts', 'kb-1', 'draft-1'] })
  })

  it('removes deleted detail state without refetching the missing draft', async () => {
    const fetchMock = stubFetch(() => jsonResponse(204, null))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(queryKeys.schemaDraft('kb-1', 'draft-1'), draftFixture)
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
    const { result } = renderHook(useSchemaDraftWorkflowMutations, { wrapper })

    await act(() => result.current.deleteDraft.mutateAsync({ knowledgeBaseId: 'kb-1', draftId: 'draft-1', revision: 7 }))

    expect(queryClient.getQueryData(queryKeys.schemaDraft('kb-1', 'draft-1'))).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE')
  })
})
