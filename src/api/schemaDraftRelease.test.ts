import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { schemaDraftReleaseApi, useSchemaDraftReleaseMutations } from './schemaDraftRelease'
import { queryKeys } from './queryKeys'
import { ApiError } from './types'
import {
  eligibilityFixture, evaluationFixture, evaluationHistoryFixture, planFixture, planHistoryFixture,
  publicationFixture, readinessFixture,
} from '../features/schema-drafts/schemaDraftFixtures'
import { isEvaluationTerminal, isPlanTerminal } from '../features/schema-drafts/schemaDraftReleaseTypes'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

afterEach(() => vi.restoreAllMocks())

describe('schemaDraftReleaseApi', () => {
  it('accepts 202 starts and sends exact evaluation and retry bodies', async () => {
    const fetchMock = stubFetch((url) => jsonResponse(202, url.endsWith('/retry') ? { runId: 'evaluation-retry', status: 'QUEUED', statusLocation: '/evaluation-runs/evaluation-retry' } : { runId: 'evaluation-1', status: 'QUEUED', statusLocation: '/evaluation-runs/evaluation-1' }))
    const started = await schemaDraftReleaseApi.startEvaluation('kb-1', 'draft-1', { revision: 7, documentIds: ['held-out-1'], advisoryEnabled: true })
    await schemaDraftReleaseApi.retryEvaluation('kb-1', 'draft-1', 'evaluation-1', 8)
    expect(started.statusLocation).toBe('/evaluation-runs/evaluation-1')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ revision: 7, documentIds: ['held-out-1'], advisoryEnabled: true }) })
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ revision: 8 }) })
  })

  it('loads authoritative eligibility and paged typed evaluation history/outcomes', async () => {
    stubFetch((url) => jsonResponse(200, url.includes('eligible-documents') ? eligibilityFixture : url.endsWith('size=20') && !url.includes('evaluation-partial') ? evaluationHistoryFixture : evaluationFixture))
    const eligibility = await schemaDraftReleaseApi.eligibility('kb-1', 'draft-1')
    const history = await schemaDraftReleaseApi.evaluations('kb-1', 'draft-1')
    const run = await schemaDraftReleaseApi.evaluation('kb-1', 'draft-1', 'evaluation-partial')
    expect(eligibility).toMatchObject({ draftRevision: 7, currentAggregateId: 'aggregate-1', readiness: 'READY', blockingReason: null })
    expect(history.content.some((item) => item.contractRevision === 'schema-draft-evaluation-v1')).toBe(true)
    expect(run.outcomes.content[0]).toMatchObject({ reused: true, status: 'SUCCEEDED' })
    expect(run.outcomes.content[1]).toMatchObject({ status: 'STALE_SOURCE', metrics: null, failureCategory: 'SOURCE_CHANGED' })
    expect(run.metrics.rates[1]).toMatchObject({ applicability: 'NOT_APPLICABLE', value: null })
  })

  it('rejects removed parallel evaluation count fields', async () => {
    stubFetch(() => jsonResponse(200, { ...evaluationFixture, outcomeCount: evaluationFixture.outcomes.totalElements }))
    await expect(schemaDraftReleaseApi.evaluation('kb-1', 'draft-1', 'evaluation-partial')).rejects.toMatchObject({ status: 200, message: 'Evaluation run response has unexpected shape' })
  })

  it('publishes only an exact readiness revision and projection hash', async () => {
    const fetchMock = stubFetch((url) => jsonResponse(200, url.endsWith('publication-readiness') ? readinessFixture : publicationFixture))
    const readiness = await schemaDraftReleaseApi.readiness('kb-1', 'draft-1')
    await schemaDraftReleaseApi.publish('kb-1', 'draft-1', { revision: readiness.draftRevision, projectionContentHash: readiness.projectionContentHash })
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ revision: 7, projectionContentHash: 'projection-sha' }) })
  })

  it('creates and retries paged plans with explicit scope and resnapshot flags', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (init?.method === 'POST') return jsonResponse(202, { planId: url.endsWith('/retry') ? 'plan-retry' : 'plan-1', status: 'QUEUED', statusLocation: '/reprocessing-plans/plan-1' })
      return jsonResponse(200, url.includes('/plan-partial') ? planFixture : planHistoryFixture)
    })
    await schemaDraftReleaseApi.createPlan('kb-1', { draftId: 'draft-1', schemaId: 'schema-2', allDocuments: false, documentIds: ['document-1'], processingOptions: { chunkSize: 500 } })
    await schemaDraftReleaseApi.retryPlan('kb-1', 'plan-1', { resnapshotUnresolvedDocuments: true })
    const detail = await schemaDraftReleaseApi.plan('kb-1', 'plan-partial')
    const history = await schemaDraftReleaseApi.plans('kb-1', 'draft-1')
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ draftId: 'draft-1', schemaId: 'schema-2', allDocuments: false, documentIds: ['document-1'], processingOptions: { chunkSize: 500 } }))
    expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ resnapshotUnresolvedDocuments: true }))
    expect(detail.items.totalElements).toBe(3)
    expect(history.content[1]).toMatchObject({ targetCurrent: false, retryable: false })
  })

  it('rejects removed parallel plan item fields and normalizes stale conflicts', async () => {
    stubFetch(() => jsonResponse(200, { ...planFixture, itemCount: 3 }))
    await expect(schemaDraftReleaseApi.plan('kb-1', 'plan-partial')).rejects.toMatchObject({ status: 200, message: 'Reprocessing plan response has unexpected shape' })
    stubFetch(() => jsonResponse(409, { title: 'Publication token stale', detail: 'Projection content hash changed', status: 409 }))
    const error = await schemaDraftReleaseApi.publish('kb-1', 'draft-1', { revision: 7, projectionContentHash: 'old' }).catch((value: unknown) => value)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'Projection content hash changed' })
  })

  it('identifies all polling terminal states', () => {
    expect(isEvaluationTerminal('RUNNING')).toBe(false)
    expect(['COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].every((status) => isEvaluationTerminal(status as 'COMPLETED'))).toBe(true)
    expect(isPlanTerminal('QUEUED')).toBe(false)
    expect(['COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].every((status) => isPlanTerminal(status as 'COMPLETED'))).toBe(true)
  })

  it('invalidates publication consumers separately from reprocessing consumers', async () => {
    stubFetch((url) => jsonResponse(url.endsWith('/publish') ? 200 : 202, url.endsWith('/publish') ? publicationFixture : { planId: 'plan-1', status: 'QUEUED', statusLocation: '/reprocessing-plans/plan-1' }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(queryKeys.schemaDraftReadiness('kb-1', 'draft-1'), readinessFixture)
    queryClient.setQueryData(queryKeys.schemaDraftPublication('kb-1', 'draft-1'), publicationFixture)
    queryClient.setQueryData(queryKeys.documents('kb-1'), [])
    queryClient.setQueryData(queryKeys.reprocessingPlanHistory('kb-1', 'draft-1', 0, 10), planHistoryFixture)
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children)
    const { result } = renderHook(useSchemaDraftReleaseMutations, { wrapper })

    await act(() => result.current.publish.mutateAsync({ knowledgeBaseId: 'kb-1', draftId: 'draft-1', payload: { revision: 7, projectionContentHash: 'projection-sha' } }))
    expect(queryClient.getQueryState(queryKeys.schemaDraftReadiness('kb-1', 'draft-1'))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.schemaDraftPublication('kb-1', 'draft-1'))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.documents('kb-1'))?.isInvalidated).toBe(false)

    await act(() => result.current.createPlan.mutateAsync({ knowledgeBaseId: 'kb-1', payload: { draftId: 'draft-1', schemaId: 'schema-2', allDocuments: true, documentIds: null, processingOptions: null } }))
    expect(queryClient.getQueryState(queryKeys.documents('kb-1'))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.reprocessingPlanHistory('kb-1', 'draft-1', 0, 10))?.isInvalidated).toBe(true)
  })
})
