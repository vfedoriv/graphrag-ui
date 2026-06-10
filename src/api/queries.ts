import { useMutation } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import type {
  GeneratedQueryResponse,
  HybridSearchRequest,
  HybridSearchResponse,
  QueryAskResponse,
  QueryExecutionResponse,
  QueryGenerateRequest,
  QueryValidateRequest,
  QueryValidation,
} from './types'

export const queriesApi = {
  generate: (knowledgeBaseId: string, payload: QueryGenerateRequest) =>
    apiFetch<GeneratedQueryResponse>(`/knowledge-bases/${knowledgeBaseId}/queries/generate`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  validate: (knowledgeBaseId: string, payload: QueryValidateRequest) =>
    apiFetch<QueryValidation>(`/knowledge-bases/${knowledgeBaseId}/queries/validate`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  execute: (knowledgeBaseId: string, payload: QueryValidateRequest) =>
    apiFetch<QueryExecutionResponse>(`/knowledge-bases/${knowledgeBaseId}/queries/execute`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  ask: (knowledgeBaseId: string, payload: QueryGenerateRequest) =>
    apiFetch<QueryAskResponse>(`/knowledge-bases/${knowledgeBaseId}/queries/ask`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  hybridSearch: (knowledgeBaseId: string, payload: HybridSearchRequest) =>
    apiFetch<HybridSearchResponse>(`/knowledge-bases/${knowledgeBaseId}/queries/hybrid-search`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
}

export const useGenerateQueryMutation = () => useMutation({ mutationFn: ({ knowledgeBaseId, prompt }: { knowledgeBaseId: string; prompt: string }) => queriesApi.generate(knowledgeBaseId, { prompt }) })

export const useValidateQueryMutation = () => useMutation({ mutationFn: ({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: QueryValidateRequest }) => queriesApi.validate(knowledgeBaseId, payload) })

export const useExecuteQueryMutation = () => useMutation({ mutationFn: ({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: QueryValidateRequest }) => queriesApi.execute(knowledgeBaseId, payload) })

export const useAskQueryMutation = () => useMutation({ mutationFn: ({ knowledgeBaseId, prompt }: { knowledgeBaseId: string; prompt: string }) => queriesApi.ask(knowledgeBaseId, { prompt }) })

export const useHybridSearchMutation = () => useMutation({ mutationFn: ({ knowledgeBaseId, payload }: { knowledgeBaseId: string; payload: HybridSearchRequest }) => queriesApi.hybridSearch(knowledgeBaseId, payload) })
