import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  schemasApi,
  useActivateSchemaMutation,
  useCreateSchemaMutation,
  useDeleteSchemaMutation,
  useGenerateSchemaExampleFromFileMutation,
  useGenerateSchemaExampleMutation,
  useGenerateSchemaJsonFromFileMutation,
  useGenerateSchemaJsonMutation,
  useGetSchemaMutation,
  useSchemasByKnowledgeBaseQuery,
  useUpdateSchemaMutation,
  useValidateSchemaMutation,
} from './schemas'
import { createTestQueryClient, jsonResponse, stubFetch } from '../test/helpers'

describe('schemas api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls schema endpoints with expected payloads', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/schemas')) return jsonResponse(200, [])
      if (url.includes('/schemas/abc') && init?.method === 'DELETE') return jsonResponse(204, {})
      if (url.includes('/schemas/abc')) return jsonResponse(200, { id: 'abc', content: '{}' })
      if (url.endsWith('/schemas/validate')) return jsonResponse(200, { valid: true, errors: [] })
      if (url.endsWith('/schemas/generate/example')) return jsonResponse(200, '{}')
      if (url.endsWith('/schemas/generate/example/from-file')) return jsonResponse(200, '{}')
      if (url.endsWith('/schemas/generate')) return jsonResponse(200, { content: '{}' })
      if (url.endsWith('/schemas/generate/from-file')) return jsonResponse(200, { content: '{}' })
      if (url.endsWith('/knowledge-bases/kb-a/schemas/sc-1/activate')) return jsonResponse(200, {})
      return jsonResponse(200, { id: 'new-schema' })
    })

    await schemasApi.list()
    await schemasApi.listForKnowledgeBase('kb-a')
    await schemasApi.get('abc')
    await schemasApi.validate({ content: 'x' })
    await schemasApi.create({ content: 'x', sourceType: 'PREDEFINED', knowledgeBaseId: 'kb-a' })
    await schemasApi.update('abc', { content: '{"name":"updated"}', sourceType: 'PREDEFINED' })
    await schemasApi.delete('abc')
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
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/schemas'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/validate'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/abc'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate/example'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate/example/from-file'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/schemas/generate/from-file'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/schemas/sc-1/activate'))).toBe(true)

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/v1/schemas') && (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(createCall?.[1]).toEqual(expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(String((createCall?.[1] as RequestInit | undefined)?.body))).toEqual({
      content: 'x',
      sourceType: 'PREDEFINED',
      knowledgeBaseId: 'kb-a',
    })

    const updateCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/v1/schemas/abc') && (init as RequestInit | undefined)?.method === 'PUT',
    )
    expect(updateCall?.[1]).toEqual(expect.objectContaining({ method: 'PUT' }))
    expect(JSON.parse(String((updateCall?.[1] as RequestInit | undefined)?.body))).toEqual({
      content: '{"name":"updated"}',
      sourceType: 'PREDEFINED',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/schemas/abc', expect.objectContaining({ method: 'DELETE' }))

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

  it('invalidates caches for create, activate, update, and delete mutations', async () => {
    stubFetch((url) => {
      if (url.endsWith('/schemas')) return jsonResponse(200, { id: 'schema-1' })
      if (url.endsWith('/schemas/schema-1')) return jsonResponse(200, { id: 'schema-1', content: '{}' })
      if (url.endsWith('/activate')) return jsonResponse(200, {})
      return jsonResponse(200, {})
    })

    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: createResult } = renderHook(() => useCreateSchemaMutation(), { wrapper })
    await createResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', payload: { content: 'x' } })

    const { result: activateResult } = renderHook(() => useActivateSchemaMutation(), { wrapper })
    await activateResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', schemaId: 'schema-1' })

    const { result: updateResult } = renderHook(() => useUpdateSchemaMutation(), { wrapper })
    await updateResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', schemaId: 'schema-1', payload: { content: '{}' } })

    const { result: deleteResult } = renderHook(() => useDeleteSchemaMutation(), { wrapper })
    await deleteResult.current.mutateAsync({ knowledgeBaseId: 'kb-a', schemaId: 'schema-1' })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schemas'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schemas', 'knowledge-base', 'kb-a'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases', 'kb-a'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schemas', 'knowledge-base', 'kb-a'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['knowledge-bases'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schemas', 'schema-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['schemas', 'lookup', 'schema-1'] })
  })

  it('loads schemas via knowledge-base-scoped query hook', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas')) {
        return jsonResponse(200, [{ id: 'schema-a', name: 'Schema A', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' }])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useSchemasByKnowledgeBaseQuery('kb-a'), { wrapper })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
  })

  it('exposes mutation hooks for schema endpoint workflows', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/schemas/schema-1')) {
        return jsonResponse(200, {
          id: 'schema-1',
          name: 'Schema',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'h',
          status: 'ACTIVE',
          createdAt: '',
          content: '{}',
        })
      }
      if (url.endsWith('/schemas/validate')) return jsonResponse(200, { valid: true, errors: [] })
      if (url.endsWith('/schemas/generate/example/from-file')) return jsonResponse(200, '{"from":"file"}')
      if (url.endsWith('/schemas/generate/example')) return jsonResponse(200, '{"from":"text"}')
      if (url.endsWith('/schemas/generate/from-file')) return jsonResponse(200, { content: '{"from":"file"}' })
      if (url.endsWith('/schemas/generate')) return jsonResponse(200, { content: '{"from":"text"}' })
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result: getSchema } = renderHook(() => useGetSchemaMutation(), { wrapper })
    const { result: validate } = renderHook(() => useValidateSchemaMutation(), { wrapper })
    const { result: generateExample } = renderHook(() => useGenerateSchemaExampleMutation(), { wrapper })
    const { result: generateExampleFromFile } = renderHook(() => useGenerateSchemaExampleFromFileMutation(), { wrapper })
    const { result: generateJson } = renderHook(() => useGenerateSchemaJsonMutation(), { wrapper })
    const { result: generateJsonFromFile } = renderHook(() => useGenerateSchemaJsonFromFileMutation(), { wrapper })

    await expect(getSchema.current.mutateAsync('schema-1')).resolves.toMatchObject({ id: 'schema-1' })
    await expect(validate.current.mutateAsync({ content: '{}' })).resolves.toEqual({ valid: true, errors: [] })
    await expect(generateExample.current.mutateAsync({ text: 'source' })).resolves.toEqual({ example: '{"from":"text"}' })
    await expect(
      generateExampleFromFile.current.mutateAsync({ file: new File(['source'], 'source.txt') }),
    ).resolves.toEqual({ example: '{"from":"file"}' })
    await expect(generateJson.current.mutateAsync({ name: 'n', version: 1, text: 'source', example: '{}' })).resolves.toEqual({
      content: '{"from":"text"}',
    })
    await expect(
      generateJsonFromFile.current.mutateAsync({
        name: 'n',
        version: 1,
        example: '{}',
        file: new File(['source'], 'source.txt'),
      }),
    ).resolves.toEqual({ content: '{"from":"file"}' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/schemas/schema-1', expect.anything())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/schemas/validate',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('supports both direct-string and wrapped-object schema example responses', async () => {
    let call = 0
    stubFetch((url) => {
      if (url.endsWith('/schemas/generate/example')) {
        call += 1
        return call === 1 ? jsonResponse(200, '{"source":"direct"}') : jsonResponse(200, { example: '{"source":"wrapped"}' })
      }
      if (url.endsWith('/schemas/generate/example/from-file')) return jsonResponse(200, { example: '{"source":"wrapped-file"}' })
      throw new Error(`Unexpected request: ${url}`)
    })

    await expect(schemasApi.generateExample({ text: 'first' })).resolves.toEqual({ example: '{"source":"direct"}' })
    await expect(schemasApi.generateExample({ text: 'second' })).resolves.toEqual({ example: '{"source":"wrapped"}' })
    await expect(
      schemasApi.generateExampleFromFile({ file: new File(['source'], 'source.txt', { type: 'text/plain' }) }),
    ).resolves.toEqual({ example: '{"source":"wrapped-file"}' })
  })

  it('throws a clear error for unexpected schema example success payload shape', async () => {
    stubFetch((url) => {
      if (url.endsWith('/schemas/generate/example')) return jsonResponse(200, { invalid: true })
      throw new Error(`Unexpected request: ${url}`)
    })

    await expect(schemasApi.generateExample({ text: 'source' })).rejects.toThrow('Schema example response has unexpected shape')
  })
})
