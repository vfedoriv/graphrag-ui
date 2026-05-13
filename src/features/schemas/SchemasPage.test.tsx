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
      if (url === '/api/v1/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'USER_DEFINED',
            format: 'YAML',
            contentHash: 'hash',
            status: 'ACTIVE',
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

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-validate-schema-yaml'))
    const validatePanel = screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-yaml')
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema YAML' }))
    await waitFor(() => {
      expect(screen.getByText('Validate failed')).toBeInTheDocument()
      expect(screen.getByText('Validate failed from server')).toBeInTheDocument()
    })
  })

  it('activates schema from table row action', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'USER_DEFINED',
            format: 'YAML',
            contentHash: 'hash',
            status: 'ACTIVE',
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
})
