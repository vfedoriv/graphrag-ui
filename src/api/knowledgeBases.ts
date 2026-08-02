import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBase,
  KnowledgeBaseAiProfileAssignment,
  UpdateKnowledgeBaseAiProfileRequest,
  UpdateKnowledgeBaseRequest,
} from './types'

export const knowledgeBaseApi = {
  list: () => apiFetch<KnowledgeBase[]>('/knowledge-bases'),
  get: (id: string) => apiFetch<KnowledgeBase>(`/knowledge-bases/${id}`),
  create: (payload: CreateKnowledgeBaseRequest) =>
    apiFetch<KnowledgeBase>('/knowledge-bases', { method: 'POST', body: toJsonBody(payload) }),
  update: (id: string, payload: UpdateKnowledgeBaseRequest) =>
    apiFetch<KnowledgeBase>(`/knowledge-bases/${id}`, { method: 'PUT', body: toJsonBody(payload) }),
  delete: (id: string) => apiFetch<void>(`/knowledge-bases/${id}`, { method: 'DELETE' }),
  getActiveAiProfile: (id: string) =>
    apiFetch<KnowledgeBaseAiProfileAssignment>(`/knowledge-bases/${id}/ai-profile`),
  updateActiveAiProfile: (id: string, payload: UpdateKnowledgeBaseAiProfileRequest) =>
    apiFetch<KnowledgeBaseAiProfileAssignment>(`/knowledge-bases/${id}/ai-profile`, {
      method: 'PUT',
      body: toJsonBody(payload),
    }),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedSearchReadiness(updated.id) })
    },
  })
}

export function useDeleteKnowledgeBaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: knowledgeBaseApi.delete,
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedSearch(id) })
    },
  })
}

export function useKnowledgeBaseActiveAiProfileQuery(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.knowledgeBaseActiveAiProfile(id) : ['knowledge-bases', 'none', 'active-ai-profile'],
    queryFn: () => knowledgeBaseApi.getActiveAiProfile(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useUpdateKnowledgeBaseActiveAiProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, profileId }: { id: string; profileId: string | null }) =>
      knowledgeBaseApi.updateActiveAiProfile(id, { profileId }),
    onSuccess: (_assignment, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBase(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBaseActiveAiProfile(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.aiProfiles() })
      queryClient.invalidateQueries({ queryKey: queryKeys.advancedSearchReadiness(variables.id) })
    },
  })
}
