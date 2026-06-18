import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  runtimeSettingsApi,
  useClearRuntimeSettingMutation,
  useUpdateRuntimeSettingMutation,
} from './runtimeSettings'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

describe('runtime settings api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls list, update, and clear endpoints with expected payloads', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, [])
      return jsonResponse(200, { key: 'query.topK', currentValue: 10 })
    })

    await runtimeSettingsApi.list()
    await runtimeSettingsApi.update('query.topK', { value: 10 })
    await runtimeSettingsApi.clear('query.topK')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/runtime-settings')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/runtime-settings/query.topK')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ value: 10 }) })
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'DELETE' })
  })

  it('updates cached settings after mutations', async () => {
    stubFetch(() => jsonResponse(200, { key: 'query.topK', currentValue: 10 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(['runtime-settings'], [{ key: 'query.topK', currentValue: 5 }])

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: updateResult } = renderHook(() => useUpdateRuntimeSettingMutation(), { wrapper })
    await updateResult.current.mutateAsync({ key: 'query.topK', value: 10 })

    const { result: clearResult } = renderHook(() => useClearRuntimeSettingMutation(), { wrapper })
    await clearResult.current.mutateAsync('query.topK')

    expect(queryClient.getQueryData(['runtime-settings'])).toEqual([{ key: 'query.topK', currentValue: 10 }])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['runtime-settings'] })
  })

  it('normalizes backend errors', async () => {
    stubFetch(() => jsonResponse(400, { title: 'Invalid setting', detail: 'Value is outside allowed range' }))

    await expect(runtimeSettingsApi.update('query.topK', { value: -1 })).rejects.toThrow('Value is outside allowed range')
  })
})
