import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  documentsApi,
  useDocumentChunksQuery,
  useDocumentProcessingOptionsQuery,
  useDocumentsQuery,
  useClearDocumentProcessingDefaultsMutation,
  useDeleteDocumentMutation,
  useProcessDocumentMutation,
  useProcessDocumentWithOptionsMutation,
  useReplaceDocumentMutation,
  useSaveDocumentProcessingDefaultsMutation,
  useUploadDocumentMutation,
} from './documents'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

describe('documents api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls list/upload/replace/delete/process/chunks endpoints', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [{ id: 'doc-1', knowledgeBaseId: 'kb-a' }])
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-delete')) {
        return {
          ok: true,
          status: 204,
          text: async () => '',
          json: async () => undefined,
        }
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      if (url.endsWith('/documents/doc-1/processing-options')) {
        return jsonResponse(200, { documentId: 'doc-1', parserId: 'tika', fileFormat: 'PDF', options: [] })
      }
      if (url.endsWith('/documents/doc-1/processing-options/defaults')) {
        return jsonResponse(200, { documentId: 'doc-1', parserId: 'tika', fileFormat: 'PDF', options: [] })
      }
      if (url.endsWith('/documents/doc-1/process')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      if (url.endsWith('/documents/doc-1/chunks')) {
        return jsonResponse(200, [{ id: 'chunk-1' }])
      }
      return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
    })

    await documentsApi.list('kb-a')
    await documentsApi.upload('kb-a', new File(['x'], 'a.txt', { type: 'text/plain' }))
    await documentsApi.replace('kb-a', 'doc-1', new File(['y'], 'b.txt', { type: 'text/plain' }))
    await documentsApi.delete('kb-a', 'doc-delete')
    await documentsApi.process('doc-1')
    await documentsApi.processingOptions('doc-1')
    await documentsApi.saveProcessingDefaults('doc-1', { options: { preserveLineBreaks: true, maxPages: 12 } })
    await documentsApi.clearProcessingDefaults('doc-1')
    await documentsApi.processWithOptions('doc-1', { allowOverwrite: true, options: { preserveLineBreaks: false } })
    await documentsApi.chunks('doc-1')

    const [uploadCall] = fetchMock.mock.calls.filter(
      (call) =>
        String(call[0]).endsWith('/api/v1/knowledge-bases/kb-a/documents') &&
        ((call[1] as RequestInit | undefined)?.method === 'POST'),
    )
    const uploadInit = uploadCall[1] as RequestInit
    expect(uploadInit.body instanceof FormData).toBe(true)

    const [replaceCall] = fetchMock.mock.calls.filter(
      (call) =>
        String(call[0]).endsWith('/api/v1/knowledge-bases/kb-a/documents/doc-1') &&
        ((call[1] as RequestInit | undefined)?.method === 'PUT'),
    )
    const replaceInit = replaceCall[1] as RequestInit
    expect(replaceInit.body instanceof FormData).toBe(true)

    expect(
      fetchMock.mock.calls.some(
        (call) =>
          String(call[0]).endsWith('/api/v1/knowledge-bases/kb-a/documents/doc-delete') &&
          ((call[1] as RequestInit | undefined)?.method === 'DELETE'),
      ),
    ).toBe(true)

    const saveDefaultsCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith('/api/v1/documents/doc-1/processing-options/defaults') &&
        ((call[1] as RequestInit | undefined)?.method === 'PUT'),
    )
    expect((saveDefaultsCall?.[1] as RequestInit).body).toBe(JSON.stringify({ options: { preserveLineBreaks: true, maxPages: 12 } }))

    const clearDefaultsCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith('/api/v1/documents/doc-1/processing-options/defaults') &&
        ((call[1] as RequestInit | undefined)?.method === 'DELETE'),
    )
    expect(clearDefaultsCall).toBeTruthy()

    const processWithOptionsCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith('/api/v1/documents/doc-1/process') &&
        !String(call[0]).includes('allowOverwrite') &&
        ((call[1] as RequestInit | undefined)?.method === 'POST') &&
        Boolean((call[1] as RequestInit | undefined)?.body),
    )
    expect((processWithOptionsCall?.[1] as RequestInit).body).toBe(
      JSON.stringify({ allowOverwrite: true, options: { preserveLineBreaks: false } }),
    )
  })

  it('invalidates document queries after upload/process/replace/delete', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-delete')) {
        return {
          ok: true,
          status: 204,
          text: async () => '',
          json: async () => undefined,
        }
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      if (url.endsWith('/documents/doc-1/processing-options/defaults')) {
        return jsonResponse(200, { documentId: 'doc-1', parserId: 'tika', fileFormat: 'PDF', options: [] })
      }
      if (url.endsWith('/documents/doc-1/process')) {
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

    const { result: saveDefaultsResult } = renderHook(() => useSaveDocumentProcessingDefaultsMutation(), { wrapper })
    await saveDefaultsResult.current.mutateAsync({ documentId: 'doc-1', options: { maxPages: 5 } })

    const { result: clearDefaultsResult } = renderHook(() => useClearDocumentProcessingDefaultsMutation(), { wrapper })
    await clearDefaultsResult.current.mutateAsync({ documentId: 'doc-1' })

    const { result: processWithOptionsResult } = renderHook(() => useProcessDocumentWithOptionsMutation(), { wrapper })
    await processWithOptionsResult.current.mutateAsync({ documentId: 'doc-1', allowOverwrite: false, options: { maxPages: 3 } })

    const { result: replaceResult } = renderHook(() => useReplaceDocumentMutation(), { wrapper })
    await replaceResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', documentId: 'doc-1', file: new File(['y'], 'b.txt') })

    const { result: deleteResult } = renderHook(() => useDeleteDocumentMutation(), { wrapper })
    await deleteResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', documentId: 'doc-delete' })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents', 'knowledge-base', 'kb-a'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents', 'chunks', 'doc-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents', 'chunks', 'doc-delete'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents', 'processing-options', 'doc-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['documents', 'processing-options', 'doc-delete'] })
  })

  it('keeps nullable document queries disabled without calling endpoints', async () => {
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: documentsResult } = renderHook(() => useDocumentsQuery(null), { wrapper })
    const { result: chunksResult } = renderHook(() => useDocumentChunksQuery(null), { wrapper })
    const { result: optionsResult } = renderHook(() => useDocumentProcessingOptionsQuery(null), { wrapper })

    await waitFor(() => {
      expect(documentsResult.current.fetchStatus).toBe('idle')
      expect(chunksResult.current.fetchStatus).toBe('idle')
      expect(optionsResult.current.fetchStatus).toBe('idle')
    })
    expect(documentsResult.current.data).toBeUndefined()
    expect(chunksResult.current.data).toBeUndefined()
    expect(optionsResult.current.data).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
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
