import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type { RuntimeSetting, UpdateRuntimeSettingRequest } from './types'

export const runtimeSettingsApi = {
  list: () => apiFetch<RuntimeSetting[]>('/runtime-settings'),
  update: (key: string, payload: UpdateRuntimeSettingRequest) =>
    apiFetch<RuntimeSetting>(`/runtime-settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: toJsonBody(payload),
    }),
  clear: (key: string) =>
    apiFetch<RuntimeSetting>(`/runtime-settings/${encodeURIComponent(key)}`, { method: 'DELETE' }),
}

export function useRuntimeSettingsQuery() {
  return useQuery({ queryKey: queryKeys.runtimeSettings(), queryFn: runtimeSettingsApi.list })
}

export function useUpdateRuntimeSettingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      runtimeSettingsApi.update(key, { value }),
    onSuccess: (updated) => {
      queryClient.setQueryData<RuntimeSetting[]>(queryKeys.runtimeSettings(), (current) =>
        current?.map((setting) => (setting.key === updated.key ? updated : setting)) ?? [updated],
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.runtimeSettings() })
    },
  })
}

export function useClearRuntimeSettingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runtimeSettingsApi.clear,
    onSuccess: (updated) => {
      queryClient.setQueryData<RuntimeSetting[]>(queryKeys.runtimeSettings(), (current) =>
        current?.map((setting) => (setting.key === updated.key ? updated : setting)) ?? [updated],
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.runtimeSettings() })
    },
  })
}
