import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { documentsApi, useProcessDocumentMutation, useUploadDocumentMutation } from './documents'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

describe('documents api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls list/upload/process/chunks endpoints', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [{ id: 'doc-1', knowledgeBaseId: 'kb-a' }])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      if (url.endsWith('/documents/doc-1/chunks')) {
        return jsonResponse(200, [{ id: 'chunk-1' }])
      }
      return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
    })

    await documentsApi.list('kb-a')
    await documentsApi.upload('kb-a', new File(['x'], 'a.txt', { type: 'text/plain' }))
    await documentsApi.process('doc-1')
    await documentsApi.chunks('doc-1')

    const [uploadCall] = fetchMock.mock.calls.filter(
      (call) =>
        String(call[0]).endsWith('/api/v1/knowledge-bases/kb-a/documents') &&
        ((call[1] as RequestInit | undefined)?.method === 'POST'),
    )
    const uploadInit = uploadCall[1] as RequestInit
    expect(uploadInit.body instanceof FormData).toBe(true)
  })

  it('invalidates document queries after upload/process', async () => {
    stubFetch((url) => {
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
    })

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: uploadResult } = renderHook(() => useUploadDocumentMutation(), { wrapper })
    await uploadResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', file: new File(['x'], 'a.txt') })

    const { result: processResult } = renderHook(() => useProcessDocumentMutation(), { wrapper })
    await processResult.current.mutateAsync({ documentId: 'doc-1' })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents', 'kb-a'] })
  })

  it('sends allowOverwrite=true when requested', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=true')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    await documentsApi.process('doc-1', true)

    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls.some((url) => url.endsWith('/api/v1/documents/doc-1/process?allowOverwrite=true'))).toBe(true)
  })
})
