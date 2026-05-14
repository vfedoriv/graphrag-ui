import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { schemasApi, useActivateSchemaMutation, useCreateSchemaMutation } from './schemas'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

describe('schemas api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls schema endpoints with expected payloads', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/schemas')) return jsonResponse(200, [])
      if (url.includes('/schemas/abc')) return jsonResponse(200, { id: 'abc', content: '{}' })
      if (url.endsWith('/schemas/validate')) return jsonResponse(200, { valid: true, errors: [] })
      if (url.endsWith('/schemas/generate/example')) return jsonResponse(200, { example: '{}' })
      if (url.endsWith('/schemas/generate/example/from-file')) return jsonResponse(200, { example: '{}' })
      if (url.endsWith('/schemas/generate')) return jsonResponse(200, { content: '{}' })
      if (url.endsWith('/schemas/generate/from-file')) return jsonResponse(200, { content: '{}' })
      if (url.endsWith('/knowledge-bases/kb-a/schemas/sc-1/activate')) return jsonResponse(200, {})
      return jsonResponse(200, { id: 'new-schema' })
    })

    await schemasApi.list()
    await schemasApi.get('abc')
    await schemasApi.validate({ content: 'x' })
    await schemasApi.create({ content: 'x' })
    await schemasApi.generateExample({ text: 'input' })
    await schemasApi.generateExampleFromFile({ file: new File(['source'], 'source.txt', { type: 'text/plain' }) })
    await schemasApi.generateJson({ name: 'n', version: 1, text: 't', example: '{}' })
    await schemasApi.generateJsonFromFile({
      name: 'n',
      version: 1,
      example: '{}',
      file: new File(['source'], 'source.txt', { type: 'text/plain' }),
    })
    await schemasApi.activate('kb-a', 'sc-1')

    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls.some((u) => u.endsWith('/api/v1/schemas'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/validate'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate/example'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate/example/from-file'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate/from-file'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/schemas/sc-1/activate'))).toBe(true)

    const exampleFromFileCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/v1/schemas/generate/example/from-file'))
    const exampleFromFileBody = exampleFromFileCall?.[1] && (exampleFromFileCall[1] as RequestInit).body
    expect(exampleFromFileBody).toBeInstanceOf(FormData)
    expect((exampleFromFileBody as FormData).get('file')).toBeInstanceOf(File)

    const jsonFromFileCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/v1/schemas/generate/from-file'))
    const jsonFromFileBody = jsonFromFileCall?.[1] && (jsonFromFileCall[1] as RequestInit).body
    expect(jsonFromFileBody).toBeInstanceOf(FormData)
    expect((jsonFromFileBody as FormData).get('request')).toBeInstanceOf(Blob)
    expect((jsonFromFileBody as FormData).get('file')).toBeInstanceOf(File)
  })

  it('invalidates caches for create and activate mutations', async () => {
    stubFetch((url) => {
      if (url.endsWith('/schemas')) return jsonResponse(200, { id: 'schema-1' })
      if (url.endsWith('/activate')) return jsonResponse(200, {})
      return jsonResponse(200, {})
    })

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: createResult } = renderHook(() => useCreateSchemaMutation(), { wrapper })
    await createResult.current.mutateAsync({ content: 'x' })

    const { result: activateResult } = renderHook(() => useActivateSchemaMutation(), { wrapper })
    await activateResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', schemaId: 'schema-1' })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schemas'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases', 'kb-a'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases'] })
  })
})
