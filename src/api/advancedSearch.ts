import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import { ApiError } from './types'
import type {
  AdvancedSearchCreateRequest,
  AdvancedSearchReadiness,
  AdvancedSearchResultEnvelope,
  AdvancedSearchResultParseResult,
  AdvancedSearchResultV1,
  AdvancedSearchRunDetail,
  AdvancedSearchRunPage,
  AdvancedSearchRunStatus,
  AdvancedSearchRunSummary,
} from './types'

const runBase = (knowledgeBaseId: string) => `/knowledge-bases/${knowledgeBaseId}/queries/advanced-search-runs`
const nullableString = z.string().nullable()
const sourceRange = z.object({ sourceStart: z.number().int().nullable(), sourceEnd: z.number().int().nullable(), pageStart: z.number().int().nullable(), pageEnd: z.number().int().nullable() }).strict()
const evidence = z.object({
  citationId: z.string(), type: z.string(), chunkId: nullableString, documentId: nullableString, range: sourceRange.nullable(),
  processingRunId: nullableString, effectiveChunkerRevision: nullableString, structuralPath: nullableString, text: nullableString,
  rank: z.number().int(), score: z.number().nullable(), sourceFilename: nullableString, sourceContentType: nullableString, sourceDisplayLabel: nullableString,
}).strict()
const claim = z.object({ id: z.string(), kind: z.string(), text: z.string(), citationIds: z.array(z.string()), graphFactIds: z.array(z.string()), graphEvidenceIds: z.array(z.string()) }).strict()
const diagnostics = z.object({
  plan: z.object({ version: z.number().int(), promptRevision: z.string(), subquestionCount: z.number().int(), exactTermCount: z.number().int(), graphRequestCount: z.number().int(), metadataConstrained: z.boolean(), fallbackUsed: z.boolean(), fallbackCategory: nullableString }).strict().nullable(),
  sufficiency: z.object({ version: z.number().int(), promptRevision: z.string(), completeCoverageCount: z.number().int(), partialCoverageCount: z.number().int(), missingCoverageCount: z.number().int(), contradictionCount: z.number().int(), concreteGap: z.boolean(), refinementCount: z.number().int(), fallbackUsed: z.boolean(), fallbackCategory: nullableString }).strict().nullable(),
  followUp: z.object({ executed: z.boolean(), queryCount: z.number().int(), skippedCategory: nullableString }).strict().nullable(),
  attempts: z.array(z.object({ roundNumber: z.number().int(), subqueryId: z.string(), retriever: z.string(), status: z.string(), candidateCount: z.number().int(), latencyMs: z.number(), failureCategory: nullableString }).strict()),
  fusion: z.object({ acceptedByChannel: z.record(z.string(), z.number().int()), truncatedByChannel: z.record(z.string(), z.number().int()), executedSubqueries: z.record(z.string(), z.number().int()), deduplicatedCandidateCount: z.number().int(), poolTruncatedCount: z.number().int(), graphDerivedCandidateCount: z.number().int() }).strict().nullable(),
  graphExpansion: z.object({ seedCount: z.number().int(), sourceRowCount: z.number().int(), attachedFactCount: z.number().int() }).strict().nullable(),
  parentContext: z.object({ evidenceConsidered: z.number().int(), contextCount: z.number().int(), tokenEstimate: z.number().int(), outcomes: z.record(z.string(), z.number().int()) }).strict().nullable(),
  rerank: z.object({ poolSize: z.number().int(), fallbackUsed: z.boolean(), fallbackCategory: nullableString }).strict().nullable(),
  selection: z.object({ requestedMaximum: z.number().int(), effectivePerDocumentCap: z.number().int(), comparisonPolicy: z.boolean(), skippedForDiversity: z.number().int(), selectedByDocument: z.record(z.string(), z.number().int()) }).strict().nullable(),
  sourceMetadata: z.object({ warnings: z.array(z.string()) }).strict().nullable(),
}).strict()
const resultV1 = z.object({
  payloadVersion: z.literal(1),
  answer: z.object({
    version: z.literal(1), status: z.string(), text: nullableString,
    confidence: z.object({ level: z.string(), score: z.number() }).strict().nullable(),
    limitations: z.array(z.object({ code: z.string(), description: z.string() }).strict()), claims: z.array(claim),
  }).strict(),
  evidence: z.array(evidence), contexts: z.array(evidence),
  graphFacts: z.array(z.object({ factId: z.string(), evidenceIds: z.array(z.string()), citationIds: z.array(z.string()) }).strict()),
  answerDiagnostics: z.object({ repairAttempted: z.boolean(), repairSucceeded: z.boolean(), abstained: z.boolean(), citationCount: z.number().int(), claimCount: z.number().int(), outcomeCategory: z.string() }).strict(),
  diagnostics: diagnostics,
}).strict()

export function serializeAdvancedSearchRequest(input: AdvancedSearchCreateRequest) {
  const maximumEvidence = typeof input.maximumEvidence === 'string' ? input.maximumEvidence.trim() : input.maximumEvidence
  return {
    query: input.query,
    ...(maximumEvidence !== undefined && maximumEvidence !== null && maximumEvidence !== '' ? { maximumEvidence: Number(maximumEvidence) } : {}),
    includeEvidenceText: input.includeEvidenceText ?? true,
  }
}

export function isAdvancedSearchRunTerminal(status: AdvancedSearchRunStatus) {
  return ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'INTERRUPTED'].includes(status)
}

export function canFetchAdvancedSearchResult(status: AdvancedSearchRunStatus | null | undefined) {
  return status === 'COMPLETED' || status === 'PARTIAL'
}

function issuesFrom(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
}

export function parseAdvancedSearchResult(raw: unknown): AdvancedSearchResultParseResult {
  const envelopeResult = z.object({ runId: z.string(), payloadVersion: z.number().int(), result: z.unknown(), createdAt: z.string() }).strict().safeParse(raw)
  if (!envelopeResult.success) {
    return { kind: 'MALFORMED', reason: 'Advanced-search result envelope has unexpected shape', raw, issues: issuesFrom(envelopeResult.error) }
  }
  const envelope = envelopeResult.data as AdvancedSearchResultEnvelope
  const nestedVersion = typeof envelope.result === 'object' && envelope.result !== null && 'payloadVersion' in envelope.result
    ? (envelope.result as { payloadVersion?: unknown }).payloadVersion
    : undefined
  if (envelope.payloadVersion !== 1 || nestedVersion !== 1) {
    return {
      kind: 'UNSUPPORTED_VERSION',
      reason: 'Advanced-search result payload versions are unsupported or mismatched',
      raw,
      payloadVersion: envelope.payloadVersion,
      nestedPayloadVersion: typeof nestedVersion === 'number' ? nestedVersion : undefined,
    }
  }
  const parsed = resultV1.safeParse(envelope.result)
  if (!parsed.success) return { kind: 'MALFORMED', reason: 'Advanced-search version-one result has unexpected shape', raw, issues: issuesFrom(parsed.error) }
  return { kind: 'VALID', envelope, result: parsed.data as AdvancedSearchResultV1, raw }
}

export const advancedSearchApi = {
  readiness: (knowledgeBaseId: string) => apiFetch<AdvancedSearchReadiness>(`${runBase(knowledgeBaseId)}/readiness`),
  create: (knowledgeBaseId: string, payload: AdvancedSearchCreateRequest) =>
    apiFetch<AdvancedSearchRunDetail>(runBase(knowledgeBaseId), { method: 'POST', body: toJsonBody(serializeAdvancedSearchRequest(payload)) }),
  history: (knowledgeBaseId: string, status: AdvancedSearchRunStatus | null = null, page = 0, size = 20) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(page))
    params.set('size', String(size))
    return apiFetch<AdvancedSearchRunPage>(`${runBase(knowledgeBaseId)}?${params.toString()}`)
  },
  detail: (knowledgeBaseId: string, runId: string) => apiFetch<AdvancedSearchRunDetail>(`${runBase(knowledgeBaseId)}/${runId}`),
  result: async (knowledgeBaseId: string, runId: string) => {
    const parsed = parseAdvancedSearchResult(await apiFetch<unknown>(`${runBase(knowledgeBaseId)}/${runId}/result`))
    if (parsed.kind === 'VALID' && parsed.envelope.runId !== runId) {
      return {
        kind: 'MALFORMED' as const,
        reason: 'Advanced-search result envelope does not belong to the focused run',
        raw: parsed.raw,
        issues: [`runId: expected ${runId}, received ${parsed.envelope.runId}`],
      }
    }
    return parsed
  },
  cancel: (knowledgeBaseId: string, runId: string) => apiFetch<AdvancedSearchRunSummary>(`${runBase(knowledgeBaseId)}/${runId}/cancel`, { method: 'POST' }),
}

export function useAdvancedSearchReadinessQuery(knowledgeBaseId: string | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.advancedSearchReadinessMaybe(knowledgeBaseId), queryFn: () => {
    if (!knowledgeBaseId) throw new Error('Cannot load advanced-search readiness without a knowledge base')
    return advancedSearchApi.readiness(knowledgeBaseId)
  }, enabled: Boolean(knowledgeBaseId && enabled), retry: false })
}

export function useAdvancedSearchHistoryQuery(knowledgeBaseId: string | null, status: AdvancedSearchRunStatus | null = null, page = 0, size = 20) {
  return useQuery({ queryKey: queryKeys.advancedSearchHistoryMaybe(knowledgeBaseId, status, page, size), queryFn: () => {
    if (!knowledgeBaseId) throw new Error('Cannot load advanced-search history without a knowledge base')
    return advancedSearchApi.history(knowledgeBaseId, status, page, size)
  }, enabled: Boolean(knowledgeBaseId), placeholderData: keepPreviousData })
}

export function useAdvancedSearchRunQuery(knowledgeBaseId: string | null, runId: string | null) {
  return useQuery({ queryKey: queryKeys.advancedSearchRunMaybe(knowledgeBaseId, runId), queryFn: () => {
    if (!knowledgeBaseId || !runId) throw new Error('Cannot load an advanced-search run without identifiers')
    return advancedSearchApi.detail(knowledgeBaseId, runId)
  }, enabled: Boolean(knowledgeBaseId && runId), refetchInterval: (query) => query.state.data && !isAdvancedSearchRunTerminal(query.state.data.status) ? 1500 : false })
}

export function useAdvancedSearchResultQuery(knowledgeBaseId: string | null, runId: string | null, status: AdvancedSearchRunStatus | null | undefined) {
  return useQuery({ queryKey: queryKeys.advancedSearchResultMaybe(knowledgeBaseId, runId), queryFn: () => {
    if (!knowledgeBaseId || !runId) throw new Error('Cannot load an advanced-search result without identifiers')
    return advancedSearchApi.result(knowledgeBaseId, runId)
  }, enabled: Boolean(knowledgeBaseId && runId && canFetchAdvancedSearchResult(status)), retry: false, refetchInterval: (query) => query.state.error instanceof ApiError && query.state.error.status === 409 ? 1500 : false })
}

export function useCreateAdvancedSearchMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: AdvancedSearchCreateRequest }) => advancedSearchApi.create(knowledgeBaseId, payload),
    onSuccess: (_run, variables) => void queryClient.invalidateQueries({ queryKey: queryKeys.advancedSearch(variables.knowledgeBaseId) }),
  })
}

export function useCancelAdvancedSearchMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, runId }: { knowledgeBaseId: string; runId: string }) => advancedSearchApi.cancel(knowledgeBaseId, runId),
    onSuccess: (_run, variables) => void queryClient.invalidateQueries({ queryKey: queryKeys.advancedSearch(variables.knowledgeBaseId) }),
  })
}
