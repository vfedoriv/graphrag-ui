import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  knowledgeBaseApi,
  useCreateKnowledgeBaseMutation,
  useDeleteKnowledgeBaseMutation,
  useUpdateKnowledgeBaseActiveAiProfileMutation,
  useUpdateKnowledgeBaseMutation,
} from './knowledgeBases'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

describe('knowledge bases api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls CRUD endpoints', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/knowledge-bases/kb-a/ai-profile')) return jsonResponse(200, { knowledgeBaseId: 'kb-a', profileId: 'profile-a' })
      if (url.endsWith('/knowledge-bases/kb-a')) return jsonResponse(200, { id: 'kb-a', name: 'KB A', activeSchemaId: null, activeAiProfileId: 'profile-a', createdAt: '' })
      return jsonResponse(200, { id: 'kb-a', name: 'KB A', activeSchemaId: null, activeAiProfileId: 'profile-a', createdAt: '' })
    })

    await knowledgeBaseApi.list()
    await knowledgeBaseApi.get('kb-a')
    await knowledgeBaseApi.create({ id: 'kb-a', name: 'KB A' })
    await knowledgeBaseApi.update('kb-a', { name: 'KB A2' })
    await knowledgeBaseApi.getActiveAiProfile('kb-a')
    await knowledgeBaseApi.updateActiveAiProfile('kb-a', { profileId: 'profile-a' })
    await knowledgeBaseApi.delete('kb-a')

    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/ai-profile'))).toBe(true)
  })

  it('applies mutation side effects to query cache', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases') || url.endsWith('/knowledge-bases/kb-a')) {
        return jsonResponse(200, { id: 'kb-a', name: 'KB A', activeSchemaId: null, activeAiProfileId: 'profile-a', createdAt: '' })
      }
      if (url.endsWith('/knowledge-bases/kb-a/ai-profile')) {
        return jsonResponse(200, { knowledgeBaseId: 'kb-a', profileId: 'profile-a' })
      }
      return jsonResponse(204, '')
    })

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: createResult } = renderHook(() => useCreateKnowledgeBaseMutation(), { wrapper })
    await createResult.current.mutateAsync({ id: 'kb-a', name: 'KB A' })

    const { result: updateResult } = renderHook(() => useUpdateKnowledgeBaseMutation(), { wrapper })
    await updateResult.current.mutateAsync({ id: 'kb-a', payload: { name: 'KB A2' } })

    const { result: deleteResult } = renderHook(() => useDeleteKnowledgeBaseMutation(), { wrapper })
    await deleteResult.current.mutateAsync('kb-a')

    const { result: assignResult } = renderHook(() => useUpdateKnowledgeBaseActiveAiProfileMutation(), { wrapper })
    await assignResult.current.mutateAsync({ id: 'kb-a', profileId: 'profile-a' })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases', 'kb-a'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases', 'kb-a', 'active-ai-profile'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ai-profiles'] })
    expect(setQueryDataSpy).toHaveBeenCalledWith(['knowledge-bases', 'kb-a'], expect.objectContaining({ id: 'kb-a' }))
  })
})
