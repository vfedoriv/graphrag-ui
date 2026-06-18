import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  aiProfilesApi,
  useCreateAiProfileMutation,
  useDeleteAiProfileMutation,
  useUpdateAiProfileMutation,
} from './aiProfiles'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

const profile = {
  id: 'default',
  name: 'Default',
  baseUrl: 'https://api.openai.com/v1',
  chatModel: 'gpt-4.1-mini',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  timeoutSeconds: 60,
  retryCount: 3,
  defaultProfile: true,
  apiKeyConfigured: true,
}

describe('ai profiles api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls CRUD endpoints with write-only API key payloads', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [profile])
      if (url.endsWith('/ai-profiles/default') && fetchMock.mock.calls.length >= 4) {
        return { ok: true, status: 204, text: async () => '', json: async () => undefined }
      }
      return jsonResponse(200, profile)
    })

    await aiProfilesApi.list()
    await aiProfilesApi.get('default')
    await aiProfilesApi.create({ ...profile, apiKey: 'secret' })
    await aiProfilesApi.update('default', { name: 'Updated' })
    await aiProfilesApi.update('default', { apiKey: 'replacement' })
    await aiProfilesApi.update('default', { clearApiKey: true })
    await aiProfilesApi.delete('default')

    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'POST', body: expect.stringContaining('"apiKey":"secret"') })
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ name: 'Updated' }) })
    expect(fetchMock.mock.calls[4][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ apiKey: 'replacement' }) })
    expect(fetchMock.mock.calls[5][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ clearApiKey: true }) })
    expect(fetchMock.mock.calls[6][1]).toMatchObject({ method: 'DELETE' })
  })

  it('invalidates profile and knowledge-base context after mutations', async () => {
    stubFetch(() => jsonResponse(200, profile))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: createResult } = renderHook(() => useCreateAiProfileMutation(), { wrapper })
    await createResult.current.mutateAsync({ ...profile, apiKey: 'secret' })

    const { result: updateResult } = renderHook(() => useUpdateAiProfileMutation(), { wrapper })
    await updateResult.current.mutateAsync({ id: 'default', payload: { name: 'Updated' } })

    const { result: deleteResult } = renderHook(() => useDeleteAiProfileMutation(), { wrapper })
    await deleteResult.current.mutateAsync('default')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ai-profiles'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases'] })
    expect(setQueryDataSpy).toHaveBeenCalledWith(['ai-profiles', 'default'], expect.objectContaining({ id: 'default' }))
  })
})
