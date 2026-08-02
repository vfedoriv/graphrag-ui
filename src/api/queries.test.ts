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

  it('propagates normalized API errors on failures', async () => {
    stubFetch(() => jsonResponse(400, { title: 'Invalid', detail: 'Bad query' }))

    await expect(queriesApi.generate('kb-a', { prompt: 'p' })).rejects.toMatchObject({
      status: 400,
      message: 'Bad query',
    })
  })

})
