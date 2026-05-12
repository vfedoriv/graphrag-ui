import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemasPage } from './SchemasPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('schemas workflows', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('runs validate and get-by-id flows from tabs', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/schemas')) return jsonResponse(200, [])
      if (url.endsWith('/schemas/validate')) return jsonResponse(200, { valid: true, errors: [] })
      if (url.endsWith('/schemas/schema-1')) return jsonResponse(200, { id: 'schema-1', name: 'S', version: 1, sourceType: 'USER_DEFINED', format: 'YAML', contentHash: 'h', status: 'ACTIVE', createdAt: '' })
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Validate schema YAML' }))
    await user.type(screen.getByPlaceholderText('Paste YAML schema content'), 'type: object')
    const validatePanel = screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-yaml')
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema YAML' }))

    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Get schema by ID' }))
    await user.type(screen.getByPlaceholderText('Schema ID'), 'schema-1')
    const getByIdPanel = screen.getByTestId('schemas-endpoint-tabs-panel-get-schema-by-id')
    await user.click(within(getByIdPanel).getByRole('button', { name: 'Get schema by ID' }))

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/schemas/validate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/schemas/schema-1'))).toBe(true)
    })
  })
})
