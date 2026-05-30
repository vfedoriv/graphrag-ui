import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemasPage } from './SchemasPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('schemas page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows activate and validate error alerts', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash',
            status: 'INACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url === '/api/v1/knowledge-bases/kb-a/schemas/schema-a/activate' && init?.method === 'POST') {
        return jsonResponse(400, { detail: 'Activate failed from server' })
      }
      if (url === '/api/v1/schemas/validate' && init?.method === 'POST') {
        return jsonResponse(400, { detail: 'Validate failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Activate' }))
    await waitFor(() => {
      expect(screen.getByText('Activate failed')).toBeInTheDocument()
      expect(screen.getByText('Activate failed from server')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-validate-schema-json'))
    const validatePanel = screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-json')
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema JSON' }))
    await waitFor(() => {
      expect(screen.getByText('Validate failed')).toBeInTheDocument()
      expect(screen.getByText('Validate failed from server')).toBeInTheDocument()
    })
  })

  it('activates schema from table row action', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash',
            status: 'INACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url === '/api/v1/knowledge-bases/kb-a/schemas/schema-a/activate' && init?.method === 'POST') {
        return jsonResponse(204, {})
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Activate' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/knowledge-bases/kb-a/schemas/schema-a/activate',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('renders non-interactive active-state action for active schema rows', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const activeButton = await screen.findByRole('button', { name: 'Active' })
    expect(activeButton).toBeDisabled()
    expect(
      fetchMock.mock.calls.some(
        ([u, req]) =>
          String(u) === '/api/v1/knowledge-bases/kb-a/schemas/schema-a/activate' &&
          (req as RequestInit | undefined)?.method === 'POST',
      ),
    ).toBe(false)
  })

  it('shows structured JSON editor guidance for schema content', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await waitFor(() => {
      expect(screen.getAllByText('Expected format: JSON').length).toBeGreaterThan(0)
    })
    const createPanel = screen.getByTestId('schemas-endpoint-tabs-panel-create-schema')

    expect(within(createPanel).getByRole('button', { name: 'Tree View' })).toBeInTheDocument()
    expect(within(createPanel).getByRole('button', { name: 'Raw View' })).toBeInTheDocument()
    expect(within(createPanel).getByTestId('visual-json-editor')).toBeInTheDocument()
  })

  it('renders schema tabs in required workflow order', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const tabsContainer = await screen.findByTestId('schemas-endpoint-tabs')
    const tabLabels = Array.from(tabsContainer.querySelectorAll('[data-testid^="schemas-endpoint-tabs-tab-"]')).map(
      (button) => button.textContent?.trim() ?? '',
    )

    expect(tabLabels).toEqual([
      'Generate schema example from text',
      'Generate schema example from file',
      'Generate schema JSON',
      'Generate schema JSON from file',
      'Validate schema JSON',
      'Create schema',
      'Get schema by ID',
    ])
  })

  it('shows pending indicator and prevents duplicate activate clicks while request is in flight', async () => {
    const user = userEvent.setup()
    let resolveActivate: ((value: ReturnType<typeof jsonResponse>) => void) | null = null
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash',
            status: 'INACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url === '/api/v1/knowledge-bases/kb-a/schemas/schema-a/activate' && init?.method === 'POST') {
        return new Promise((resolve) => {
          resolveActivate = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Activate' }))
    expect(await screen.findByText(/Waiting for schema workflow response\.\.\./i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activating...' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Activating...' }))
    expect(
      fetchMock.mock.calls.filter(
        ([u, req]) =>
          String(u) === '/api/v1/knowledge-bases/kb-a/schemas/schema-a/activate' &&
          (req as RequestInit | undefined)?.method === 'POST',
      ).length,
    ).toBe(1)

    resolveActivate?.(jsonResponse(204, {}))
    await waitFor(() => expect(screen.queryByText(/Waiting for schema workflow response\.\.\./i)).not.toBeInTheDocument())
  })

  it('shows visible fallback when API returns unsupported schema source type', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'LEGACY',
            format: 'JSON',
            contentHash: 'hash',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('Unsupported schema source type')).toBeInTheDocument()
    expect(screen.getByText('UNSUPPORTED (LEGACY)')).toBeInTheDocument()
  })

  it('shows contextual empty state when selected knowledge base has no schemas', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })
    expect(await screen.findByText('No Schemas for selected knowledge base')).toBeInTheDocument()
  })
})
