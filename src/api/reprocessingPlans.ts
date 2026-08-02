import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  ChunkMigrationPreview,
  ChunkMigrationPreviewRequest,
  CreateReprocessingPlanRequest,
  PageResponse,
  ReprocessingHistoryFilters,
  ReprocessingPlanDetail,
  ReprocessingPlanReason,
  ReprocessingPlanStatus,
  ReprocessingPlanSummary,
  RetryReprocessingPlanRequest,
  StartReprocessingPlanResponse,
  ChunkReprocessingSelection,
} from './types'

const planBase = (knowledgeBaseId: string) => `/knowledge-bases/${knowledgeBaseId}/reprocessing-plans`
const paging = (page: number, size: number) => `page=${page}&size=${size}`

function optionalParams(params: Record<string, string | null | undefined>) {
  return Object.entries(params)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== null && entry[1] !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
}

export function isReprocessingPlanTerminal(status: ReprocessingPlanStatus) {
  return ['BLOCKED', 'COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].includes(status)
}

export function isReprocessingPlanActive(status: ReprocessingPlanStatus) {
  return !isReprocessingPlanTerminal(status)
}

export const reprocessingPlansApi = {
  previewMigration: (knowledgeBaseId: string, payload: ChunkMigrationPreviewRequest, page = 0, size = 20) =>
    apiFetch<ChunkMigrationPreview>(`/knowledge-bases/${knowledgeBaseId}/chunk-migrations/preview?${paging(page, size)}`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  create: (knowledgeBaseId: string, payload: CreateReprocessingPlanRequest) =>
    apiFetch<StartReprocessingPlanResponse>(planBase(knowledgeBaseId), {
      method: 'POST',
      body: toJsonBody(payload.selection && payload.selection !== 'DOCUMENT_IDS' ? { ...payload, documentIds: undefined } : payload),
    }),
  detail: (knowledgeBaseId: string, planId: string, page = 0, size = 20) =>
    apiFetch<ReprocessingPlanDetail>(`${planBase(knowledgeBaseId)}/${planId}?${paging(page, size)}`),
  history: (knowledgeBaseId: string, filters: ReprocessingHistoryFilters = {}, page = 0, size = 20) => {
    const filterQuery = optionalParams({
      draftId: filters.draftId,
      reason: filters.reason,
      selection: filters.selection,
      status: filters.status,
    })
    return apiFetch<PageResponse<ReprocessingPlanSummary>>(`${planBase(knowledgeBaseId)}?${filterQuery ? `${filterQuery}&` : ''}${paging(page, size)}`)
  },
  retry: (knowledgeBaseId: string, planId: string, _payload: RetryReprocessingPlanRequest = { mode: 'RESNAPSHOT_UNRESOLVED' }) => {
    void _payload
    return apiFetch<StartReprocessingPlanResponse>(`${planBase(knowledgeBaseId)}/${planId}/retry`, {
      method: 'POST',
      body: toJsonBody({ mode: 'RESNAPSHOT_UNRESOLVED' }),
    })
  },
}

export function useChunkMigrationPreviewQuery(
  knowledgeBaseId: string | null,
  payload: ChunkMigrationPreviewRequest | null,
  page = 0,
  size = 20,
) {
  return useQuery({
    queryKey: knowledgeBaseId && payload
      ? queryKeys.chunkMigrationPreview(knowledgeBaseId, payload.selection, payload.documentIds ?? null, payload.processingOptions ?? null, page, size)
      : queryKeys.chunkMigrationPreviewMaybe(null, payload?.selection ?? 'none', payload?.documentIds ?? null, payload?.processingOptions ?? null, page, size),
    queryFn: () => {
      if (!knowledgeBaseId || !payload) throw new Error('Cannot preview migration without a knowledge base and selection')
      return reprocessingPlansApi.previewMigration(knowledgeBaseId, payload, page, size)
    },
    enabled: Boolean(knowledgeBaseId && payload),
  })
}

export function useReprocessingPlanHistoryQuery(
  knowledgeBaseId: string | null,
  filters: ReprocessingHistoryFilters = {},
  page = 0,
  size = 20,
) {
  return useQuery({
    queryKey: knowledgeBaseId
      ? queryKeys.reprocessingPlanHistoryFiltered(knowledgeBaseId, filters, page, size)
      : queryKeys.reprocessingPlanHistoryFilteredMaybe(null, filters, page, size),
    queryFn: () => {
      if (!knowledgeBaseId) throw new Error('Cannot load reprocessing plans without a knowledge base')
      return reprocessingPlansApi.history(knowledgeBaseId, filters, page, size)
    },
    enabled: Boolean(knowledgeBaseId),
    placeholderData: keepPreviousData,
  })
}

export function useReprocessingPlanDetailQuery(knowledgeBaseId: string | null, planId: string | null, page = 0, size = 20) {
  return useQuery({
    queryKey: queryKeys.reprocessingPlanMaybe(knowledgeBaseId, planId, page, size),
    queryFn: () => {
      if (!knowledgeBaseId || !planId) throw new Error('Cannot load a reprocessing plan without identifiers')
      return reprocessingPlansApi.detail(knowledgeBaseId, planId, page, size)
    },
    enabled: Boolean(knowledgeBaseId && planId),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => query.state.data && isReprocessingPlanActive(query.state.data.status) ? 1500 : false,
  })
}

export function useCreateReprocessingPlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: CreateReprocessingPlanRequest }) =>
      reprocessingPlansApi.create(knowledgeBaseId, payload),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', variables.knowledgeBaseId] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(variables.knowledgeBaseId) })
    },
  })
}

export function useRetryReprocessingPlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, planId, payload }: { knowledgeBaseId: string; planId: string; payload?: RetryReprocessingPlanRequest }) =>
      reprocessingPlansApi.retry(knowledgeBaseId, planId, payload),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', variables.knowledgeBaseId] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(variables.knowledgeBaseId) })
    },
  })
}

export type { ChunkReprocessingSelection, ReprocessingPlanReason }
