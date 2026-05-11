import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type { CreateKnowledgeBaseRequest, KnowledgeBase, UpdateKnowledgeBaseRequest } from './types'

export const knowledgeBaseApi = {
  list: () => apiFetch<KnowledgeBase[]>('/knowledge-bases'),
  get: (id: string) => apiFetch<KnowledgeBase>(`/knowledge-bases/${id}`),
  create: (payload: CreateKnowledgeBaseRequest) =>
    apiFetch<KnowledgeBase>('/knowledge-bases', { method: 'POST', body: toJsonBody(payload) }),
  update: (id: string, payload: UpdateKnowledgeBaseRequest) =>
    apiFetch<KnowledgeBase>(`/knowledge-bases/${id}`, { method: 'PUT', body: toJsonBody(payload) }),
  delete: (id: string) => apiFetch<void>(`/knowledge-bases/${id}`, { method: 'DELETE' }),
}

export function useKnowledgeBasesQuery() {
  return useQuery({ queryKey: queryKeys.knowledgeBases(), queryFn: knowledgeBaseApi.list })
}

export function useCreateKnowledgeBaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: knowledgeBaseApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() }),
  })
}

export function useUpdateKnowledgeBaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateKnowledgeBaseRequest }) =>
      knowledgeBaseApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
      queryClient.setQueryData(queryKeys.knowledgeBase(updated.id), updated)
    },
  })
}

export function useDeleteKnowledgeBaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: knowledgeBaseApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() }),
  })
}
