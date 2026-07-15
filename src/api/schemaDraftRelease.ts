import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  CreatePlanRequest, PublishDraftRequest, RetryPlanRequest, StartEvaluationRequest,
} from '../features/schema-drafts/schemaDraftReleaseTypes'
import { isEvaluationTerminal, isPlanTerminal } from '../features/schema-drafts/schemaDraftReleaseTypes'
import { schemaDraftReleaseValidation as validate } from '../features/schema-drafts/schemaDraftReleaseValidation'

const draftBase = (knowledgeBaseId: string, draftId: string) => `/knowledge-bases/${knowledgeBaseId}/schema-drafts/${draftId}`
const planBase = (knowledgeBaseId: string) => `/knowledge-bases/${knowledgeBaseId}/reprocessing-plans`
const paging = (page: number, size: number) => `page=${page}&size=${size}`
const parsed = async <T>(promise: Promise<unknown>, parser: (value: unknown) => T) => parser(await promise)

export const schemaDraftReleaseApi = {
  eligibility: (knowledgeBaseId: string, draftId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/evaluation-eligible-documents?${paging(page, size)}`), validate.eligibility),
  startEvaluation: (knowledgeBaseId: string, draftId: string, payload: StartEvaluationRequest) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/evaluation-runs`, { method: 'POST', body: toJsonBody(payload) }), validate.startEvaluation),
  evaluation: (knowledgeBaseId: string, draftId: string, runId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/evaluation-runs/${runId}?${paging(page, size)}`), validate.evaluation),
  evaluations: (knowledgeBaseId: string, draftId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/evaluation-runs?${paging(page, size)}`), validate.evaluations),
  retryEvaluation: (knowledgeBaseId: string, draftId: string, runId: string, revision: number) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/evaluation-runs/${runId}/retry`, { method: 'POST', body: toJsonBody({ revision }) }), validate.startEvaluation),
  readiness: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/publication-readiness`), validate.readiness),
  publish: (knowledgeBaseId: string, draftId: string, payload: PublishDraftRequest) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/publish`, { method: 'POST', body: toJsonBody(payload) }), validate.publication),
  publication: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/publication`), validate.publication),
  createPlan: (knowledgeBaseId: string, payload: CreatePlanRequest) => parsed(apiFetch<unknown>(planBase(knowledgeBaseId), { method: 'POST', body: toJsonBody(payload) }), validate.startPlan),
  plan: (knowledgeBaseId: string, planId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${planBase(knowledgeBaseId)}/${planId}?${paging(page, size)}`), validate.plan),
  plans: (knowledgeBaseId: string, draftId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${planBase(knowledgeBaseId)}?draftId=${encodeURIComponent(draftId)}&${paging(page, size)}`), validate.plans),
  retryPlan: (knowledgeBaseId: string, planId: string, payload: RetryPlanRequest) => parsed(apiFetch<unknown>(`${planBase(knowledgeBaseId)}/${planId}/retry`, { method: 'POST', body: toJsonBody(payload) }), validate.startPlan),
}

function requireIds(knowledgeBaseId: string | null, draftId: string | null) {
  if (!knowledgeBaseId || !draftId) throw new Error('Cannot load draft release data without knowledge base and draft identifiers')
  return { knowledgeBaseId, draftId }
}

export function useEvaluationEligibilityQuery(knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.schemaDraftEvaluationEligibilityMaybe(knowledgeBaseId, draftId, page, size), queryFn: () => { const ids = requireIds(knowledgeBaseId, draftId); return schemaDraftReleaseApi.eligibility(ids.knowledgeBaseId, ids.draftId, page, size) }, enabled: Boolean(knowledgeBaseId && draftId), placeholderData: keepPreviousData })
}
export function useEvaluationHistoryQuery(knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.schemaDraftEvaluationHistoryMaybe(knowledgeBaseId, draftId, page, size), queryFn: () => { const ids = requireIds(knowledgeBaseId, draftId); return schemaDraftReleaseApi.evaluations(ids.knowledgeBaseId, ids.draftId, page, size) }, enabled: Boolean(knowledgeBaseId && draftId), placeholderData: keepPreviousData })
}
export function useEvaluationQuery(knowledgeBaseId: string | null, draftId: string | null, runId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.schemaDraftEvaluationMaybe(knowledgeBaseId, draftId, runId, page, size), queryFn: () => { const ids = requireIds(knowledgeBaseId, draftId); if (!runId) throw new Error('Cannot load evaluation without a run id'); return schemaDraftReleaseApi.evaluation(ids.knowledgeBaseId, ids.draftId, runId, page, size) }, enabled: Boolean(knowledgeBaseId && draftId && runId), placeholderData: keepPreviousData, refetchInterval: (query) => query.state.data && !isEvaluationTerminal(query.state.data.status) ? 1500 : false })
}
export function useReadinessQuery(knowledgeBaseId: string | null, draftId: string | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.schemaDraftReadinessMaybe(knowledgeBaseId, draftId), queryFn: () => { const ids = requireIds(knowledgeBaseId, draftId); return schemaDraftReleaseApi.readiness(ids.knowledgeBaseId, ids.draftId) }, enabled: Boolean(knowledgeBaseId && draftId && enabled), retry: false })
}
export function usePublicationQuery(knowledgeBaseId: string | null, draftId: string | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.schemaDraftPublicationMaybe(knowledgeBaseId, draftId), queryFn: () => { const ids = requireIds(knowledgeBaseId, draftId); return schemaDraftReleaseApi.publication(ids.knowledgeBaseId, ids.draftId) }, enabled: Boolean(knowledgeBaseId && draftId && enabled), retry: false })
}
export function usePlanHistoryQuery(knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.reprocessingPlanHistoryMaybe(knowledgeBaseId, draftId, page, size), queryFn: () => { const ids = requireIds(knowledgeBaseId, draftId); return schemaDraftReleaseApi.plans(ids.knowledgeBaseId, ids.draftId, page, size) }, enabled: Boolean(knowledgeBaseId && draftId), placeholderData: keepPreviousData })
}
export function usePlanQuery(knowledgeBaseId: string | null, planId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.reprocessingPlanMaybe(knowledgeBaseId, planId, page, size), queryFn: () => { if (!knowledgeBaseId || !planId) throw new Error('Cannot load a reprocessing plan without identifiers'); return schemaDraftReleaseApi.plan(knowledgeBaseId, planId, page, size) }, enabled: Boolean(knowledgeBaseId && planId), placeholderData: keepPreviousData, refetchInterval: (query) => query.state.data && !isPlanTerminal(query.state.data.status) ? 1500 : false })
}

export function useSchemaDraftReleaseMutations() {
  const queryClient = useQueryClient()
  const invalidateDraft = (knowledgeBaseId: string, draftId: string) => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['schema-drafts', knowledgeBaseId, draftId] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.schemaDrafts(knowledgeBaseId) }),
  ])
  return {
    startEvaluation: useMutation({ mutationFn: ({ knowledgeBaseId, draftId, payload }: { knowledgeBaseId: string; draftId: string; payload: StartEvaluationRequest }) => schemaDraftReleaseApi.startEvaluation(knowledgeBaseId, draftId, payload), onSuccess: (_result, variables) => invalidateDraft(variables.knowledgeBaseId, variables.draftId) }),
    retryEvaluation: useMutation({ mutationFn: ({ knowledgeBaseId, draftId, runId, revision }: { knowledgeBaseId: string; draftId: string; runId: string; revision: number }) => schemaDraftReleaseApi.retryEvaluation(knowledgeBaseId, draftId, runId, revision), onSuccess: (_result, variables) => invalidateDraft(variables.knowledgeBaseId, variables.draftId) }),
    publish: useMutation({ mutationFn: ({ knowledgeBaseId, draftId, payload }: { knowledgeBaseId: string; draftId: string; payload: PublishDraftRequest }) => schemaDraftReleaseApi.publish(knowledgeBaseId, draftId, payload), onSuccess: (_result, variables) => invalidateDraft(variables.knowledgeBaseId, variables.draftId), onError: async (_error, variables) => { await queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftReadiness(variables.knowledgeBaseId, variables.draftId) }); await invalidateDraft(variables.knowledgeBaseId, variables.draftId) } }),
    createPlan: useMutation({ mutationFn: ({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: CreatePlanRequest }) => schemaDraftReleaseApi.createPlan(knowledgeBaseId, payload), onSuccess: (_result, variables) => { void queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', variables.knowledgeBaseId] }); void queryClient.invalidateQueries({ queryKey: queryKeys.documents(variables.knowledgeBaseId) }) } }),
    retryPlan: useMutation({ mutationFn: ({ knowledgeBaseId, planId, payload }: { knowledgeBaseId: string; planId: string; payload: RetryPlanRequest }) => schemaDraftReleaseApi.retryPlan(knowledgeBaseId, planId, payload), onSuccess: (_result, variables) => { void queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', variables.knowledgeBaseId] }); void queryClient.invalidateQueries({ queryKey: queryKeys.documents(variables.knowledgeBaseId) }) } }),
  }
}
