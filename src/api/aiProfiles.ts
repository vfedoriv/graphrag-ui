import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type { AiProfile, CreateAiProfileRequest, UpdateAiProfileRequest } from './types'

export const aiProfilesApi = {
  list: () => apiFetch<AiProfile[]>('/ai-profiles'),
  get: (id: string) => apiFetch<AiProfile>(`/ai-profiles/${encodeURIComponent(id)}`),
  create: (payload: CreateAiProfileRequest) =>
    apiFetch<AiProfile>('/ai-profiles', { method: 'POST', body: toJsonBody(payload) }),
  update: (id: string, payload: UpdateAiProfileRequest) =>
    apiFetch<AiProfile>(`/ai-profiles/${encodeURIComponent(id)}`, { method: 'PUT', body: toJsonBody(payload) }),
  delete: (id: string) => apiFetch<void>(`/ai-profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export function useAiProfilesQuery() {
  return useQuery({ queryKey: queryKeys.aiProfiles(), queryFn: aiProfilesApi.list })
}

export function useAiProfileQuery(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.aiProfile(id) : ['ai-profiles', 'none'],
    queryFn: () => aiProfilesApi.get(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateAiProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiProfilesApi.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiProfiles() })
      queryClient.setQueryData(queryKeys.aiProfile(created.id), created)
    },
  })
}

export function useUpdateAiProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAiProfileRequest }) =>
      aiProfilesApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiProfiles() })
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
      queryClient.setQueryData(queryKeys.aiProfile(updated.id), updated)
    },
  })
}

export function useDeleteAiProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiProfilesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiProfiles() })
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
    },
  })
}
