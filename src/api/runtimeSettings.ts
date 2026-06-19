import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type { BulkUpdateRuntimeSettingsRequest, RuntimeSetting, UpdateRuntimeSettingRequest } from './types'

export const runtimeSettingsApi = {
  list: () => apiFetch<RuntimeSetting[]>('/runtime-settings'),
  update: (key: string, payload: UpdateRuntimeSettingRequest) =>
    apiFetch<RuntimeSetting>(`/runtime-settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: toJsonBody(payload),
    }),
  updateMany: (payload: BulkUpdateRuntimeSettingsRequest) =>
    apiFetch<RuntimeSetting[]>('/runtime-settings', {
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

export function useBulkUpdateRuntimeSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runtimeSettingsApi.updateMany,
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData<RuntimeSetting[]>(queryKeys.runtimeSettings(), (current) => {
        const updatedByKey = new Map(updatedSettings.map((setting) => [setting.key, setting]))
        const replaced = current?.map((setting) => updatedByKey.get(setting.key) ?? setting) ?? []
        const existingKeys = new Set(replaced.map((setting) => setting.key))
        return [
          ...replaced,
          ...updatedSettings.filter((setting) => !existingKeys.has(setting.key)),
        ]
      })
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
