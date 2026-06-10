import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueriesPage } from './QueriesPage'
import { jsonResponse } from '../../test/helpers'
import { renderWithProviders, stubFetch } from '../../test/helpers'

describe('queries page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows ask error alert when ask mutation fails', async () => {
    const user = userEvent.setup()
    stubFetch((url) => {
      if (url.endsWith('/queries/ask')) {
        return jsonResponse(400, { detail: 'Ask failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByRole('button', { name: 'Ask' }))

    await waitFor(() => {
      expect(screen.getByText('Ask failed')).toBeInTheDocument()
      expect(screen.getByText('Ask failed from server')).toBeInTheDocument()
    })
  })

  it('shows JSON format guidance and formats query parameter payloads', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-generate-cypher'))
    expect(screen.getAllByText('Expected format: JSON').length).toBeGreaterThan(0)
    const generatePanel = screen.getByTestId('queries-endpoint-tabs-panel-generate-cypher')

    const paramsInput = within(generatePanel).getByLabelText('Generated query parameters JSON')
    fireEvent.change(paramsInput, { target: { value: '{"x":1}' } })
    await user.click(within(generatePanel).getByRole('button', { name: 'Format JSON' }))

    expect((paramsInput as HTMLTextAreaElement).value).toBe('{\n  "x": 1\n}')
  })

  it('shows the hybrid search tab alongside existing query tabs', () => {
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(screen.getByTestId('queries-endpoint-tabs-tab-ask-query')).toHaveTextContent('Ask query')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search')).toHaveTextContent('Hybrid search')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-generate-cypher')).toHaveTextContent('Generate Cypher')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-validate-cypher')).toHaveTextContent('Validate Cypher')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-execute-cypher')).toHaveTextContent('Execute Cypher')
  })

  it('shows pending indicator and prevents duplicate ask clicks while request is in flight', async () => {
    const user = userEvent.setup()
    let resolveAsk: ((value: ReturnType<typeof jsonResponse>) => void) | null = null
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/queries/ask')) {
        return new Promise((resolve) => {
          resolveAsk = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(await screen.findByText(/Waiting for backend query response\.\.\./i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Asking...' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Asking...' }))
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/queries/ask')).length).toBe(1)

    resolveAsk?.(
      jsonResponse(200, {
        generatedQuery: {
          cypher: 'MATCH (n) RETURN n',
          explanation: '',
          parameters: {},
          validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 },
        },
        execution: {
          cypher: '',
          parameters: {},
          validation: { valid: true, cypher: '', parameters: {}, errors: [], maxRows: 10, timeoutSeconds: 5 },
          columns: ['name'],
          rows: [{ name: 'A' }],
          rowCount: 1,
          executionTimeMs: 1,
        },
      }),
    )

    await waitFor(() => expect(screen.queryByText(/Waiting for backend query response\.\.\./i)).not.toBeInTheDocument())
  })

  it('blocks validate and execute requests while parameter JSON is invalid', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-validate-cypher'))
    const validatePanel = screen.getByTestId('queries-endpoint-tabs-panel-validate-cypher')
    const validateParams = within(validatePanel).getByLabelText('Query parameters JSON')
    fireEvent.change(validateParams, { target: { value: '{{' } })
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate' }))

    expect(within(validatePanel).getByText('Cannot submit invalid JSON parameters.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-execute-cypher'))
    const executePanel = screen.getByTestId('queries-endpoint-tabs-panel-execute-cypher')
    await user.click(within(executePanel).getByRole('button', { name: 'Execute' }))

    expect(within(executePanel).getByText('Cannot submit invalid JSON parameters.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks hybrid search while local option bounds are invalid', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search'))
    const hybridPanel = screen.getByTestId('queries-endpoint-tabs-panel-hybrid-search')

    fireEvent.change(within(hybridPanel).getByLabelText('Hit limit'), { target: { value: '0' } })
    await user.click(within(hybridPanel).getByRole('button', { name: 'Search' }))
    expect(within(hybridPanel).getByText('Hybrid search options invalid')).toBeInTheDocument()
    expect(within(hybridPanel).getByText('Hit limit must be at least 1.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.change(within(hybridPanel).getByLabelText('Hit limit'), { target: { value: '3' } })
    fireEvent.change(within(hybridPanel).getByLabelText('Graph depth'), { target: { value: '-1' } })
    await user.click(within(hybridPanel).getByRole('button', { name: 'Search' }))
    expect(within(hybridPanel).getByText('Graph depth must be 0 or greater.')).toBeInTheDocument()
    expect((within(hybridPanel).getByLabelText('Graph depth') as HTMLInputElement).value).toBe('-1')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows hybrid search failure feedback without clearing inputs', async () => {
    const user = userEvent.setup()
    stubFetch((url) => {
      if (url.endsWith('/queries/hybrid-search')) {
        return jsonResponse(500, { detail: 'Hybrid backend unavailable' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-hybrid-search'))
    const hybridPanel = screen.getByTestId('queries-endpoint-tabs-panel-hybrid-search')
    await user.type(within(hybridPanel).getByLabelText('Search query'), 'find graph evidence')
    await user.click(within(hybridPanel).getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      expect(within(hybridPanel).getByText('Hybrid search failed')).toBeInTheDocument()
      expect(within(hybridPanel).getByText('Hybrid backend unavailable')).toBeInTheDocument()
    })
    expect((within(hybridPanel).getByLabelText('Search query') as HTMLTextAreaElement).value).toBe('find graph evidence')
  })
})
