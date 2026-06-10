import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueriesPage } from './QueriesPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('queries workflows', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('runs ask, generate, validate, and execute flows', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/queries/ask')) {
        return jsonResponse(200, {
          generatedQuery: { cypher: 'MATCH (n) RETURN n', explanation: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 } },
          execution: { cypher: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 }, columns: ['name'], rows: [{ name: 'A' }], rowCount: 1, executionTimeMs: 1 },
        })
      }
      if (url.endsWith('/queries/generate')) {
        return jsonResponse(200, { cypher: 'MATCH (n) RETURN n', explanation: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 } })
      }
      if (url.endsWith('/queries/validate')) {
        return jsonResponse(200, { valid: true, cypher: 'MATCH (n) RETURN n', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 })
      }
      if (url.endsWith('/queries/execute')) {
        return jsonResponse(200, { cypher: '', parameters: {}, validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 }, columns: ['name'], rows: [{ name: 'A' }], rowCount: 1, executionTimeMs: 1 })
      }
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const askPanel = screen.getByTestId('queries-endpoint-tabs-panel-ask-query')
    await user.type(within(askPanel).getByLabelText('Question prompt'), 'who?')
    await user.click(within(askPanel).getByRole('button', { name: 'Ask' }))

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-generate-cypher'))
    const generatePanel = screen.getByTestId('queries-endpoint-tabs-panel-generate-cypher')
    await user.click(within(generatePanel).getByRole('button', { name: 'Generate Cypher' }))
    expect(await within(generatePanel).findByDisplayValue('MATCH (n) RETURN n')).toBeInTheDocument()

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-validate-cypher'))
    const validatePanel = screen.getByTestId('queries-endpoint-tabs-panel-validate-cypher')
    expect(within(validatePanel).getByDisplayValue('MATCH (n) RETURN n')).toBeInTheDocument()
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate' }))

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-execute-cypher'))
    const executePanel = screen.getByTestId('queries-endpoint-tabs-panel-execute-cypher')
    await user.click(within(executePanel).getByRole('button', { name: 'Execute' }))

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/ask'))).toBe(true)
      expect(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search')).toHaveTextContent('Hybrid search')
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/generate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/validate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/execute'))).toBe(true)
    })
  })

  it('runs hybrid search with selected knowledge base scope and renders evidence plus graph context', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/queries/hybrid-search')) {
        return jsonResponse(200, {
          query: 'find graph evidence',
          topK: 2,
          graphDepth: 1,
          includeChunkText: true,
          hitCount: 1,
          executionTimeMs: 25,
          hits: [
            {
              chunkId: 'chunk-7',
              documentId: 'doc-3',
              chunkIndex: 4,
              score: 0.87,
              text: 'Hybrid chunk evidence text',
              source: {
                documentId: 'doc-3',
                filename: 'evidence.md',
                contentType: 'text/markdown',
                metadata: { section: 'intro' },
              },
              graphContext: {
                entities: [
                  { id: 'entity-a', type: 'Concept', labels: ['Concept', 'Topic'], properties: { name: 'GraphRAG' } },
                ],
                relationships: [
                  { id: 'rel-a', type: 'RELATED_TO', startEntityId: 'entity-a', endEntityId: 'entity-b', properties: { confidence: 0.7 } },
                ],
              },
            },
          ],
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-selected' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search'))
    const hybridPanel = screen.getByTestId('queries-endpoint-tabs-panel-hybrid-search')
    await user.type(within(hybridPanel).getByLabelText('Search query'), 'find graph evidence')
    await user.clear(within(hybridPanel).getByLabelText('Hit limit'))
    await user.type(within(hybridPanel).getByLabelText('Hit limit'), '2')
    await user.clear(within(hybridPanel).getByLabelText('Graph depth'))
    await user.type(within(hybridPanel).getByLabelText('Graph depth'), '1')
    await user.click(within(hybridPanel).getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/knowledge-bases/kb-selected/queries/hybrid-search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            query: 'find graph evidence',
            topK: 2,
            graphDepth: 1,
            includeChunkText: true,
          }),
        }),
      )
    })

    expect(await within(hybridPanel).findByText('Hybrid search summary')).toBeInTheDocument()
    expect(within(hybridPanel).getAllByText('find graph evidence').length).toBeGreaterThan(0)
    expect(within(hybridPanel).getByText('Hit count')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('25 ms')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('Rank 1: chunk-7')).toBeInTheDocument()
    expect(within(hybridPanel).getAllByText('doc-3').length).toBeGreaterThan(0)
    expect(within(hybridPanel).getByText('Hybrid chunk evidence text')).toBeInTheDocument()
    expect(within(hybridPanel).getAllByText('entity-a').length).toBeGreaterThan(0)
    expect(within(hybridPanel).getByText('Concept, Topic')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('rel-a')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('RELATED_TO')).toBeInTheDocument()
  })

  it('shows hybrid search pending state and disables endpoint tab switching', async () => {
    let resolveSearch: ((value: ReturnType<typeof jsonResponse>) => void) | null = null
    stubFetch((url) => {
      if (url.endsWith('/queries/hybrid-search')) {
        return new Promise((resolve) => {
          resolveSearch = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search'))
    const hybridPanel = screen.getByTestId('queries-endpoint-tabs-panel-hybrid-search')
    await user.type(within(hybridPanel).getByLabelText('Search query'), 'slow search')
    await user.click(within(hybridPanel).getByRole('button', { name: 'Search' }))

    expect(await screen.findByText(/Waiting for backend query response\.\.\./i)).toBeInTheDocument()
    expect(within(hybridPanel).getByRole('button', { name: 'Searching...' })).toBeDisabled()
    expect(screen.getByTestId('queries-endpoint-tabs-tab-ask-query')).toBeDisabled()

    resolveSearch?.(jsonResponse(200, {
      query: 'slow search',
      topK: 5,
      graphDepth: 1,
      includeChunkText: true,
      hitCount: 0,
      executionTimeMs: 4,
      hits: [],
    }))

    await waitFor(() => expect(screen.queryByText(/Waiting for backend query response\.\.\./i)).not.toBeInTheDocument())
  })

  it('renders an empty state when hybrid search returns no hits', async () => {
    stubFetch((url) => {
      if (url.endsWith('/queries/hybrid-search')) {
        return jsonResponse(200, {
          query: 'nothing',
          topK: 5,
          graphDepth: 0,
          includeChunkText: false,
          hitCount: 0,
          executionTimeMs: 3,
          hits: [],
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search'))
    const hybridPanel = screen.getByTestId('queries-endpoint-tabs-panel-hybrid-search')
    await user.type(within(hybridPanel).getByLabelText('Search query'), 'nothing')
    await user.click(within(hybridPanel).getByLabelText('Include chunk text'))
    await user.clear(within(hybridPanel).getByLabelText('Graph depth'))
    await user.type(within(hybridPanel).getByLabelText('Graph depth'), '0')
    await user.click(within(hybridPanel).getByRole('button', { name: 'Search' }))

    expect(await within(hybridPanel).findByText('No hybrid search hits')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('The search completed but returned no ranked chunk evidence.')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('No')).toBeInTheDocument()
  })
})
