import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  CreateDraftRequest,
  DecisionRequest,
  DraftResponse,
  ResolveConflictRequest,
  UpdateDraftRequest,
  UpdateGuidanceRequest,
} from '../features/schema-drafts/schemaDraftTypes'
import { isTerminalAnalysisStatus } from '../features/schema-drafts/schemaDraftTypes'
import { schemaDraftValidation as validate } from '../features/schema-drafts/schemaDraftValidation'

const base = (knowledgeBaseId: string) => `/knowledge-bases/${knowledgeBaseId}/schema-drafts`
const draftBase = (knowledgeBaseId: string, draftId: string) => `${base(knowledgeBaseId)}/${draftId}`
const pageParams = (page: number, size: number) => `?page=${page}&size=${size}`

async function parsed<T>(promise: Promise<unknown>, parser: (value: unknown) => T) {
  return parser(await promise)
}

export const schemaDraftsApi = {
  list: (knowledgeBaseId: string) => parsed(apiFetch<unknown>(base(knowledgeBaseId)), validate.drafts),
  get: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(draftBase(knowledgeBaseId, draftId)), validate.draft),
  create: (knowledgeBaseId: string, payload: CreateDraftRequest) => parsed(apiFetch<unknown>(base(knowledgeBaseId), { method: 'POST', body: toJsonBody(payload) }), validate.draft),
  update: (knowledgeBaseId: string, draftId: string, payload: UpdateDraftRequest) => parsed(apiFetch<unknown>(draftBase(knowledgeBaseId, draftId), { method: 'PUT', body: toJsonBody(payload) }), validate.draft),
  updateGuidance: (knowledgeBaseId: string, draftId: string, payload: UpdateGuidanceRequest) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/guidance`, { method: 'PUT', body: toJsonBody(payload) }), validate.draft),
  delete: (knowledgeBaseId: string, draftId: string, revision: number) => apiFetch<void>(`${draftBase(knowledgeBaseId, draftId)}?revision=${revision}`, { method: 'DELETE' }),
  sources: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/sources`), validate.sources),
  addDocumentSource: (knowledgeBaseId: string, draftId: string, revision: number, documentId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/sources/documents`, { method: 'POST', body: toJsonBody({ revision, documentId }) }), validate.source),
  addTextSource: (knowledgeBaseId: string, draftId: string, revision: number, name: string, text: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/sources/text`, { method: 'POST', body: toJsonBody({ revision, name, text }) }), validate.source),
  addFileSource: (knowledgeBaseId: string, draftId: string, revision: number, file: File) => {
    const form = new FormData()
    form.set('file', file)
    return parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/sources/files?revision=${revision}`, { method: 'POST', body: form }), validate.source)
  },
  refreshSource: (knowledgeBaseId: string, draftId: string, sourceId: string, revision: number) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/sources/${sourceId}/refresh`, { method: 'POST', body: toJsonBody({ revision }) }), validate.source),
  removeSource: (knowledgeBaseId: string, draftId: string, sourceId: string, revision: number) => apiFetch<void>(`${draftBase(knowledgeBaseId, draftId)}/sources/${sourceId}?revision=${revision}`, { method: 'DELETE' }),
  restoreSource: (knowledgeBaseId: string, draftId: string, sourceId: string, revision: number) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/sources/${sourceId}/restore`, { method: 'POST', body: toJsonBody({ revision }) }), validate.source),
  startAnalysis: (knowledgeBaseId: string, draftId: string, revision: number) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/analysis-runs`, { method: 'POST', body: toJsonBody({ revision }) }), validate.startAnalysis),
  analysisRun: (knowledgeBaseId: string, draftId: string, runId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/analysis-runs/${runId}${pageParams(page, size)}`), validate.run),
  analysisHistory: (knowledgeBaseId: string, draftId: string, page = 0, size = 20) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/analysis-runs${pageParams(page, size)}`), validate.runs),
  retryAnalysis: (knowledgeBaseId: string, draftId: string, runId: string, revision: number) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/analysis-runs/${runId}/retry`, { method: 'POST', body: toJsonBody({ revision }) }), validate.startAnalysis),
  candidates: (knowledgeBaseId: string, draftId: string, page = 0, size = 50) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/candidates${pageParams(page, size)}`), validate.candidates),
  decide: (knowledgeBaseId: string, draftId: string, payload: DecisionRequest) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/decisions`, { method: 'POST', body: toJsonBody(payload) }), validate.decision),
  decisions: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/decisions`), validate.decisions),
  conflicts: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/conflicts`), validate.conflicts),
  resolveConflict: (knowledgeBaseId: string, draftId: string, conflictId: string, payload: ResolveConflictRequest) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/conflicts/${conflictId}/resolution`, { method: 'POST', body: toJsonBody(payload) }), validate.conflict),
  projection: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/projection`), validate.projection),
  diff: (knowledgeBaseId: string, draftId: string) => parsed(apiFetch<unknown>(`${draftBase(knowledgeBaseId, draftId)}/diff`), validate.diff),
}

function requireIds(knowledgeBaseId: string | null, draftId: string | null) {
  if (!knowledgeBaseId || !draftId) throw new Error('Cannot load schema draft data without knowledge base and draft identifiers')
  return { knowledgeBaseId, draftId }
}

export function useSchemaDraftsQuery(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: queryKeys.schemaDraftsMaybe(knowledgeBaseId),
    queryFn: () => {
      if (!knowledgeBaseId) throw new Error('Cannot load schema drafts without a selected knowledge base')
      return schemaDraftsApi.list(knowledgeBaseId)
    },
    enabled: Boolean(knowledgeBaseId),
  })
}

export function useSchemaDraftQuery(knowledgeBaseId: string | null, draftId: string | null) {
  return useQuery({
    queryKey: queryKeys.schemaDraftMaybe(knowledgeBaseId, draftId),
    queryFn: () => {
      const ids = requireIds(knowledgeBaseId, draftId)
      return schemaDraftsApi.get(ids.knowledgeBaseId, ids.draftId)
    },
    enabled: Boolean(knowledgeBaseId && draftId),
  })
}

export function useSchemaDraftSourcesQuery(knowledgeBaseId: string | null, draftId: string | null) {
  return useQuery({ queryKey: queryKeys.schemaDraftSourcesMaybe(knowledgeBaseId, draftId), queryFn: () => {
    const ids = requireIds(knowledgeBaseId, draftId)
    return schemaDraftsApi.sources(ids.knowledgeBaseId, ids.draftId)
  }, enabled: Boolean(knowledgeBaseId && draftId) })
}

export function useSchemaDraftAnalysisHistoryQuery(knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.schemaDraftAnalysisHistoryMaybe(knowledgeBaseId, draftId, page, size), queryFn: () => {
    const ids = requireIds(knowledgeBaseId, draftId)
    return schemaDraftsApi.analysisHistory(ids.knowledgeBaseId, ids.draftId, page, size)
  }, enabled: Boolean(knowledgeBaseId && draftId), placeholderData: keepPreviousData })
}

export function useSchemaDraftAnalysisRunQuery(knowledgeBaseId: string | null, draftId: string | null, runId: string | null, page: number, size: number) {
  return useQuery({ queryKey: queryKeys.schemaDraftAnalysisRunMaybe(knowledgeBaseId, draftId, runId, page, size), queryFn: () => {
    const ids = requireIds(knowledgeBaseId, draftId)
    if (!runId) throw new Error('Cannot load analysis without a run id')
    return schemaDraftsApi.analysisRun(ids.knowledgeBaseId, ids.draftId, runId, page, size)
  }, enabled: Boolean(knowledgeBaseId && draftId && runId), placeholderData: keepPreviousData,
  refetchInterval: (query) => query.state.data && !isTerminalAnalysisStatus(query.state.data.status) ? 1500 : false })
}

const candidateBackendPageSize = 50

export async function loadAllSchemaDraftCandidates(knowledgeBaseId: string, draftId: string) {
  const firstPage = await schemaDraftsApi.candidates(knowledgeBaseId, draftId, 0, candidateBackendPageSize)
  if (firstPage.totalElements <= firstPage.content.length) return firstPage.content
  if (firstPage.size <= 0) throw new Error('Candidate page response cannot be completed because its page size is zero')

  const pageCount = Math.ceil(firstPage.totalElements / firstPage.size)
  const remainingPages = await Promise.all(Array.from(
    { length: pageCount - 1 },
    (_, index) => schemaDraftsApi.candidates(knowledgeBaseId, draftId, index + 1, firstPage.size),
  ))
  return [firstPage, ...remainingPages].flatMap((page) => page.content)
}

export function useSchemaDraftCandidatesQuery(knowledgeBaseId: string | null, draftId: string | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.schemaDraftCandidatesMaybe(knowledgeBaseId, draftId), queryFn: () => {
    const ids = requireIds(knowledgeBaseId, draftId)
    return loadAllSchemaDraftCandidates(ids.knowledgeBaseId, ids.draftId)
  }, enabled: Boolean(knowledgeBaseId && draftId && enabled) })
}

export function useSchemaDraftReviewQueries(knowledgeBaseId: string | null, draftId: string | null, enabled = true) {
  const idsReady = Boolean(knowledgeBaseId && draftId && enabled)
  const ids = () => requireIds(knowledgeBaseId, draftId)
  return {
    decisions: useQuery({ queryKey: knowledgeBaseId && draftId ? queryKeys.schemaDraftDecisions(knowledgeBaseId, draftId) : ['schema-drafts', 'none', 'decisions'], queryFn: () => { const value = ids(); return schemaDraftsApi.decisions(value.knowledgeBaseId, value.draftId) }, enabled: idsReady }),
    conflicts: useQuery({ queryKey: knowledgeBaseId && draftId ? queryKeys.schemaDraftConflicts(knowledgeBaseId, draftId) : ['schema-drafts', 'none', 'conflicts'], queryFn: () => { const value = ids(); return schemaDraftsApi.conflicts(value.knowledgeBaseId, value.draftId) }, enabled: idsReady }),
    projection: useQuery({ queryKey: knowledgeBaseId && draftId ? queryKeys.schemaDraftProjection(knowledgeBaseId, draftId) : ['schema-drafts', 'none', 'projection'], queryFn: () => { const value = ids(); return schemaDraftsApi.projection(value.knowledgeBaseId, value.draftId) }, enabled: idsReady, retry: false }),
    diff: useQuery({ queryKey: knowledgeBaseId && draftId ? queryKeys.schemaDraftDiff(knowledgeBaseId, draftId) : ['schema-drafts', 'none', 'diff'], queryFn: () => { const value = ids(); return schemaDraftsApi.diff(value.knowledgeBaseId, value.draftId) }, enabled: idsReady, retry: false }),
  }
}

function useDraftMutation<TVars extends { knowledgeBaseId: string; draftId?: string }, TResult>(mutationFn: (variables: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: (result, variables) => {
    if (variables.draftId && result && typeof result === 'object' && 'revision' in result) queryClient.setQueryData(queryKeys.schemaDraft(variables.knowledgeBaseId, variables.draftId), result as unknown as DraftResponse)
    void queryClient.invalidateQueries({ queryKey: queryKeys.schemaDrafts(variables.knowledgeBaseId) })
  }, onError: (_error, variables) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.schemaDrafts(variables.knowledgeBaseId) })
    if (variables.draftId) void queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraft(variables.knowledgeBaseId, variables.draftId) })
  } })
}

export function useCreateSchemaDraftMutation() {
  return useDraftMutation(({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: CreateDraftRequest }) => schemaDraftsApi.create(knowledgeBaseId, payload))
}
export function useUpdateSchemaDraftMutation() {
  return useDraftMutation(({ knowledgeBaseId, draftId, payload }: { knowledgeBaseId: string; draftId: string; payload: UpdateDraftRequest }) => schemaDraftsApi.update(knowledgeBaseId, draftId, payload))
}
export function useUpdateSchemaDraftGuidanceMutation() {
  return useDraftMutation(({ knowledgeBaseId, draftId, payload }: { knowledgeBaseId: string; draftId: string; payload: UpdateGuidanceRequest }) => schemaDraftsApi.updateGuidance(knowledgeBaseId, draftId, payload))
}

function useWorkflowMutation<T>(
  fn: (variables: T & { knowledgeBaseId: string; draftId: string }) => Promise<unknown>,
  refresh: (knowledgeBaseId: string, draftId: string) => Promise<void>,
  refreshOnBadRequest = false,
) {
  return useMutation({ mutationFn: fn, onSuccess: (_result, variables) => refresh(variables.knowledgeBaseId, variables.draftId), onError: (error, variables) => {
    if (error && typeof error === 'object' && 'status' in error && (error.status === 409 || (refreshOnBadRequest && error.status === 400))) void refresh(variables.knowledgeBaseId, variables.draftId)
  } })
}

export function useSchemaDraftWorkflowMutations() {
  const queryClient = useQueryClient()
  const refresh = async (knowledgeBaseId: string, draftId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraft(knowledgeBaseId, draftId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.schemaDrafts(knowledgeBaseId) }),
      queryClient.invalidateQueries({ queryKey: ['schema-drafts', knowledgeBaseId, draftId] }),
    ])
  }
  const deleteDraft = useMutation({
    mutationFn: ({ knowledgeBaseId, draftId, revision }: { knowledgeBaseId: string; draftId: string; revision: number }) =>
      schemaDraftsApi.delete(knowledgeBaseId, draftId, revision),
    onSuccess: async (_result, variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.schemaDraft(variables.knowledgeBaseId, variables.draftId) })
      queryClient.removeQueries({ queryKey: ['schema-drafts', variables.knowledgeBaseId, variables.draftId] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.schemaDrafts(variables.knowledgeBaseId) })
    },
    onError: async (error, variables) => {
      if (error && typeof error === 'object' && 'status' in error && error.status === 409) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraft(variables.knowledgeBaseId, variables.draftId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.schemaDrafts(variables.knowledgeBaseId) }),
        ])
      }
    },
  })
  return {
    deleteDraft,
    addDocument: useWorkflowMutation(({ knowledgeBaseId, draftId, revision, documentId }: { knowledgeBaseId: string; draftId: string; revision: number; documentId: string }) => schemaDraftsApi.addDocumentSource(knowledgeBaseId, draftId, revision, documentId), refresh),
    addText: useWorkflowMutation(({ knowledgeBaseId, draftId, revision, name, text }: { knowledgeBaseId: string; draftId: string; revision: number; name: string; text: string }) => schemaDraftsApi.addTextSource(knowledgeBaseId, draftId, revision, name, text), refresh),
    addFile: useWorkflowMutation(({ knowledgeBaseId, draftId, revision, file }: { knowledgeBaseId: string; draftId: string; revision: number; file: File }) => schemaDraftsApi.addFileSource(knowledgeBaseId, draftId, revision, file), refresh),
    refreshSource: useWorkflowMutation(({ knowledgeBaseId, draftId, sourceId, revision }: { knowledgeBaseId: string; draftId: string; sourceId: string; revision: number }) => schemaDraftsApi.refreshSource(knowledgeBaseId, draftId, sourceId, revision), refresh),
    removeSource: useWorkflowMutation(({ knowledgeBaseId, draftId, sourceId, revision }: { knowledgeBaseId: string; draftId: string; sourceId: string; revision: number }) => schemaDraftsApi.removeSource(knowledgeBaseId, draftId, sourceId, revision), refresh),
    restoreSource: useWorkflowMutation(({ knowledgeBaseId, draftId, sourceId, revision }: { knowledgeBaseId: string; draftId: string; sourceId: string; revision: number }) => schemaDraftsApi.restoreSource(knowledgeBaseId, draftId, sourceId, revision), refresh),
    startAnalysis: useWorkflowMutation(({ knowledgeBaseId, draftId, revision }: { knowledgeBaseId: string; draftId: string; revision: number }) => schemaDraftsApi.startAnalysis(knowledgeBaseId, draftId, revision), refresh, true),
    retryAnalysis: useWorkflowMutation(({ knowledgeBaseId, draftId, runId, revision }: { knowledgeBaseId: string; draftId: string; runId: string; revision: number }) => schemaDraftsApi.retryAnalysis(knowledgeBaseId, draftId, runId, revision), refresh, true),
    decide: useWorkflowMutation(({ knowledgeBaseId, draftId, payload }: { knowledgeBaseId: string; draftId: string; payload: DecisionRequest }) => schemaDraftsApi.decide(knowledgeBaseId, draftId, payload), refresh),
    resolveConflict: useWorkflowMutation(({ knowledgeBaseId, draftId, conflictId, payload }: { knowledgeBaseId: string; draftId: string; conflictId: string; payload: ResolveConflictRequest }) => schemaDraftsApi.resolveConflict(knowledgeBaseId, draftId, conflictId, payload), refresh),
  }
}
