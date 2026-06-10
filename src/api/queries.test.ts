import { queriesApi } from './queries'
import { jsonResponse, stubFetch } from '../test/helpers'

describe('queries api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends requests to generate/validate/execute/ask endpoints', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/generate')) {
        return jsonResponse(200, { cypher: 'MATCH (n) RETURN n', explanation: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 } })
      }
      if (url.endsWith('/validate')) {
        return jsonResponse(200, { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 })
      }
      if (url.endsWith('/execute')) {
        return jsonResponse(200, { cypher: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 }, columns: [], rows: [], rowCount: 0, executionTimeMs: 1 })
      }
      return jsonResponse(200, {
        generatedQuery: { cypher: '', explanation: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 } },
        execution: { cypher: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 }, columns: [], rows: [], rowCount: 0, executionTimeMs: 1 },
      })
    })

    await queriesApi.generate('kb-a', { prompt: 'p' })
    await queriesApi.validate('kb-a', { cypher: 'MATCH (n) RETURN n' })
    await queriesApi.execute('kb-a', { cypher: 'MATCH (n) RETURN n' })
    await queriesApi.ask('kb-a', { prompt: 'p' })

    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/generate'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/validate'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/execute'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/ask'))).toBe(true)
  })

  it('serializes hybrid search requests and parses nested responses', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/hybrid-search')) {
        return jsonResponse(200, {
          query: 'graph search',
          topK: 3,
          graphDepth: 2,
          includeChunkText: true,
          hitCount: 1,
          executionTimeMs: 42,
          hits: [
            {
              chunkId: 'chunk-1',
              documentId: 'doc-1',
              chunkIndex: 7,
              score: 0.91,
              text: 'chunk text',
              source: {
                documentId: 'doc-1',
                filename: 'source.pdf',
                contentType: 'application/pdf',
                metadata: { page: 2 },
              },
              graphContext: {
                entities: [
                  { id: 'entity-1', type: 'Person', labels: ['Person'], properties: { name: 'Ada' } },
                ],
                relationships: [
                  { id: 'rel-1', type: 'MENTIONS', startEntityId: 'entity-1', endEntityId: 'entity-2', properties: { weight: 1 } },
                ],
              },
            },
          ],
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const response = await queriesApi.hybridSearch('kb-a', {
      query: 'graph search',
      topK: 3,
      graphDepth: 2,
      includeChunkText: true,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/knowledge-bases/kb-a/queries/hybrid-search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          query: 'graph search',
          topK: 3,
          graphDepth: 2,
          includeChunkText: true,
        }),
      }),
    )
    expect(response.hits[0].source.metadata).toEqual({ page: 2 })
    expect(response.hits[0].graphContext.entities[0].properties).toEqual({ name: 'Ada' })
    expect(response.hits[0].graphContext.relationships[0].type).toBe('MENTIONS')
  })

  it('propagates normalized API errors on failures', async () => {
    stubFetch(() => jsonResponse(400, { title: 'Invalid', detail: 'Bad query' }))

    await expect(queriesApi.generate('kb-a', { prompt: 'p' })).rejects.toMatchObject({
      status: 400,
      message: 'Bad query',
    })
  })

  it('propagates normalized API errors for hybrid search failures', async () => {
    stubFetch(() => jsonResponse(422, { title: 'Invalid hybrid search', detail: 'topK must be greater than zero' }))

    await expect(queriesApi.hybridSearch('kb-a', {
      query: 'graph search',
      topK: 0,
      graphDepth: 1,
      includeChunkText: false,
    })).rejects.toMatchObject({
      status: 422,
      message: 'topK must be greater than zero',
    })
  })
})
