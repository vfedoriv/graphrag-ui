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

    await user.click(await screen.findByTestId('schemas-endpoint-tabs-tab-validate-schema-yaml'))
    const validatePanel = screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-yaml')
    await user.type(within(validatePanel).getByLabelText('Schema YAML content'), 'type: object')
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema YAML' }))

    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-get-schema-by-id'))
    const getByIdPanel = screen.getByTestId('schemas-endpoint-tabs-panel-get-schema-by-id')
    await user.type(within(getByIdPanel).getByLabelText('Schema ID'), 'schema-1')
    await user.click(within(getByIdPanel).getByRole('button', { name: 'Get schema by ID' }))
    expect(await within(getByIdPanel).findByDisplayValue(/"id": "schema-1"/)).toBeInTheDocument()

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/schemas/validate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/schemas/schema-1'))).toBe(true)
    })
  })

  it('shows response outputs for schema yaml generation tabs and replaces get-by-id output with latest response', async () => {
    let getByIdCount = 0
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/schemas') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/schemas/generate') && init?.method === 'POST') {
        return jsonResponse(200, { content: 'name: generated-schema\nversion: 1' })
      }
      if (url.endsWith('/schemas/schema-1')) {
        getByIdCount += 1
        return jsonResponse(200, {
          id: 'schema-1',
          name: getByIdCount === 1 ? 'first' : 'second',
          version: 1,
          sourceType: 'USER_DEFINED',
          format: 'YAML',
          contentHash: 'h',
          status: 'ACTIVE',
          createdAt: '',
        })
      }
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const generateYamlPanel = await screen.findByTestId('schemas-endpoint-tabs-panel-generate-schema-yaml')
    await user.type(within(generateYamlPanel).getByLabelText('Source text'), 'customer record')
    await user.click(within(generateYamlPanel).getByRole('button', { name: 'Generate schema YAML' }))
    await waitFor(() => {
      expect(within(generateYamlPanel).getByLabelText('Generated schema YAML')).toHaveValue('name: generated-schema\nversion: 1')
    })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-generate-schema-yaml-file'))
    const generateYamlFilePanel = screen.getByTestId('schemas-endpoint-tabs-panel-generate-schema-yaml-file')
    await user.click(within(generateYamlFilePanel).getByRole('button', { name: 'Generate schema YAML from file' }))
    await waitFor(() => {
      expect(within(generateYamlFilePanel).getByLabelText('Generated schema YAML')).toHaveValue('name: generated-schema\nversion: 1')
    })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-get-schema-by-id'))
    const getByIdPanel = screen.getByTestId('schemas-endpoint-tabs-panel-get-schema-by-id')
    await user.type(within(getByIdPanel).getByLabelText('Schema ID'), 'schema-1')
    await user.click(within(getByIdPanel).getByRole('button', { name: 'Get schema by ID' }))
    expect(await within(getByIdPanel).findByDisplayValue(/"name": "first"/)).toBeInTheDocument()

    await user.click(within(getByIdPanel).getByRole('button', { name: 'Get schema by ID' }))
    expect(await within(getByIdPanel).findByDisplayValue(/"name": "second"/)).toBeInTheDocument()
  })
})
