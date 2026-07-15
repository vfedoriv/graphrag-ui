import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { schemaDraftsApi, useSchemaDraftWorkflowMutations } from './schemaDrafts'
import { ApiError } from './types'
import { queryKeys } from './queryKeys'
import { analysisDetailFixture, analysisHistoryFixture, candidatePageFixture, draftFixture, validationProblemFixture } from '../features/schema-drafts/schemaDraftFixtures'
import { isTerminalAnalysisStatus } from '../features/schema-drafts/schemaDraftTypes'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

afterEach(() => vi.restoreAllMocks())

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

  it('accepts standard analysis and nested outcome pages', async () => {
    stubFetch((url) => jsonResponse(200, url.includes('run-partial') ? analysisDetailFixture : analysisHistoryFixture))
    const history = await schemaDraftsApi.analysisHistory('kb-1', 'draft-1')
    const detail = await schemaDraftsApi.analysisRun('kb-1', 'draft-1', 'run-partial')
    expect(history.content).toHaveLength(4)
    expect(detail.sourceOutcomes.totalElements).toBe(3)
    expect(detail.sourceOutcomes.content[0].reused).toBe(true)
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
