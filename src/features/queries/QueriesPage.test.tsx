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

  it('shows exactly the four supported query workflows', () => {
    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(screen.getByTestId('queries-endpoint-tabs-tab-ask-query')).toHaveTextContent('Ask query')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-generate-cypher')).toHaveTextContent('Generate Cypher')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-validate-cypher')).toHaveTextContent('Validate Cypher')
    expect(screen.getByTestId('queries-endpoint-tabs-tab-execute-cypher')).toHaveTextContent('Execute Cypher')
    expect(screen.queryByTestId('queries-endpoint-tabs-tab-hybrid-search')).not.toBeInTheDocument()
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
      if (url.endsWith('/knowledge-bases') || url.endsWith('/ai-profiles') || url.endsWith('/runtime-settings')) {
        return jsonResponse(200, [])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-validate-cypher'))
    const validatePanel = screen.getByTestId('queries-endpoint-tabs-panel-validate-cypher')
    const validateParams = within(validatePanel).getByLabelText('Query parameters JSON')
    fireEvent.change(validateParams, { target: { value: '{{' } })
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate' }))

    expect(within(validatePanel).getByText('Cannot submit invalid JSON parameters.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/queries/validate'))).toBe(false)

    await user.click(screen.getByTestId('queries-endpoint-tabs-tab-execute-cypher'))
    const executePanel = screen.getByTestId('queries-endpoint-tabs-panel-execute-cypher')
    await user.click(within(executePanel).getByRole('button', { name: 'Execute' }))

    expect(within(executePanel).getByText('Cannot submit invalid JSON parameters.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/queries/execute'))).toBe(false)
  })

})
