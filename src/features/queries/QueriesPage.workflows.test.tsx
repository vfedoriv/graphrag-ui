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
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/generate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/validate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/queries/execute'))).toBe(true)
    })
  })
})
