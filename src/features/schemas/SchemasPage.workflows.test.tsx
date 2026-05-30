import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemasPage } from './SchemasPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('schemas workflows', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('runs validate and get-by-id flows from tabs', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/schemas') && init?.method === 'POST') return jsonResponse(200, { id: 'created-schema' })
      if (url.endsWith('/schemas')) return jsonResponse(200, [])
      if (url.endsWith('/schemas/validate')) return jsonResponse(200, { valid: true, errors: [] })
      if (url.endsWith('/schemas/schema-1')) return jsonResponse(200, { id: 'schema-1', name: 'S', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' })
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByTestId('schemas-endpoint-tabs-tab-validate-schema-json'))
    const validatePanel = screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-json')
    fireEvent.change(within(validatePanel).getByLabelText('Mock structured JSON data'), { target: { value: '{"type":"object"}' } })
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema JSON' }))

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

    const validateCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/v1/schemas/validate'))
    const validatePayload = JSON.parse(String((validateCall?.[1] as RequestInit | undefined)?.body)) as { content: string }
    expect(JSON.parse(validatePayload.content)).toEqual({ type: 'object' })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-create-schema'))
    const createPanel = screen.getByTestId('schemas-endpoint-tabs-panel-create-schema')
    await user.click(within(createPanel).getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/api/v1/schemas') && (init as RequestInit | undefined)?.method === 'POST')
      const createPayload = JSON.parse(String((createCall?.[1] as RequestInit | undefined)?.body)) as { content: string, sourceType: string }
      expect(JSON.parse(createPayload.content)).toEqual({ type: 'object' })
      expect(createPayload.sourceType).toBe('PREDEFINED')
    })
  })

  it('shows response outputs for schema JSON generation tabs and replaces get-by-id output with latest response', async () => {
    let getByIdCount = 0
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/schemas/generate') && init?.method === 'POST') {
        return jsonResponse(200, { content: '{"name":"generated-schema","version":1}' })
      }
      if (url.endsWith('/schemas/generate/from-file') && init?.method === 'POST') {
        return jsonResponse(200, { content: '{"name":"generated-schema","version":1}' })
      }
      if (url.endsWith('/schemas/schema-1')) {
        getByIdCount += 1
        return jsonResponse(200, {
          id: 'schema-1',
          name: getByIdCount === 1 ? 'first' : 'second',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'h',
          status: 'ACTIVE',
          createdAt: '',
        })
      }
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const generateJsonPanel = await screen.findByTestId('schemas-endpoint-tabs-panel-generate-schema-json')
    await user.type(within(generateJsonPanel).getByLabelText('Source text'), 'customer record')
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Generate schema JSON' }))
    await waitFor(() => {
      expect(within(generateJsonPanel).getByLabelText('Mock structured JSON data')).toHaveValue('{\n  "name": "generated-schema",\n  "version": 1\n}')
    })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-generate-schema-json-file'))
    const generateJsonFilePanel = screen.getByTestId('schemas-endpoint-tabs-panel-generate-schema-json-file')
    const sourceFileInput = within(generateJsonFilePanel).getByTestId('schemas-json-file-select-input')
    await user.upload(sourceFileInput, new File(['customer record'], 'customer.txt', { type: 'text/plain' }))
    await user.click(within(generateJsonFilePanel).getByRole('button', { name: 'Generate schema JSON from file' }))
    await waitFor(() => {
      expect(within(generateJsonFilePanel).getByLabelText('Mock structured JSON data')).toHaveValue('{\n  "name": "generated-schema",\n  "version": 1\n}')
    })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-get-schema-by-id'))
    const getByIdPanel = screen.getByTestId('schemas-endpoint-tabs-panel-get-schema-by-id')
    await user.type(within(getByIdPanel).getByLabelText('Schema ID'), 'schema-1')
    await user.click(within(getByIdPanel).getByRole('button', { name: 'Get schema by ID' }))
    expect(await within(getByIdPanel).findByDisplayValue(/"name": "first"/)).toBeInTheDocument()

    await user.click(within(getByIdPanel).getByRole('button', { name: 'Get schema by ID' }))
    expect(await within(getByIdPanel).findByDisplayValue(/"name": "second"/)).toBeInTheDocument()
  })

  it('keeps edited generated schema draft when a later generation request fails', async () => {
    let generateCount = 0
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/schemas/generate') && init?.method === 'POST') {
        generateCount += 1
        return generateCount === 1
          ? jsonResponse(200, { content: '{"name":"generated-schema","version":1}' })
          : jsonResponse(500, { detail: 'Generation failed from server' })
      }
      if (url.endsWith('/schemas/validate') && init?.method === 'POST') {
        return jsonResponse(200, { valid: true, errors: [] })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const generateJsonPanel = await screen.findByTestId('schemas-endpoint-tabs-panel-generate-schema-json')
    await user.type(within(generateJsonPanel).getByLabelText('Source text'), 'customer record')
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Generate schema JSON' }))

    const output = await within(generateJsonPanel).findByLabelText('Mock structured JSON data')
    fireEvent.change(output, { target: { value: '{"name":"edited"}' } })
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Generate schema JSON' }))

    expect(await within(generateJsonPanel).findByText('Generation failed from server')).toBeInTheDocument()
    expect(output).toHaveValue('{\n  "name": "edited"\n}')

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-validate-schema-json'))
    const validatePanel = screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-json')
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema JSON' }))
    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    const validateCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/v1/schemas/validate'))
    const validatePayload = JSON.parse(String((validateCall?.[1] as RequestInit | undefined)?.body)) as { content: string }
    expect(JSON.parse(validatePayload.content)).toEqual({ name: 'edited' })
  })

  it('renders normalized schema example output for text and file tabs', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/schemas/generate/example') && init?.method === 'POST') return jsonResponse(200, '[{"from":"text"}]')
      if (url.endsWith('/schemas/generate/example/from-file') && init?.method === 'POST') return jsonResponse(200, { example: '[{"from":"file"}]' })
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const textPanel = await screen.findByTestId('schemas-endpoint-tabs-panel-generate-schema-example-text')
    await user.type(within(textPanel).getByLabelText('Source text'), 'bio')
    await user.click(within(textPanel).getByRole('button', { name: 'Generate schema example' }))
    await waitFor(() => {
      expect(within(textPanel).getByLabelText('Generated schema example')).toHaveValue('[{"from":"text"}]')
    })

    await user.click(screen.getByTestId('schemas-endpoint-tabs-tab-generate-schema-example-file'))
    const filePanel = screen.getByTestId('schemas-endpoint-tabs-panel-generate-schema-example-file')
    const sourceFileInput = within(filePanel).getByTestId('schemas-example-file-select-input')
    await user.upload(sourceFileInput, new File(['bio'], 'bio.txt', { type: 'text/plain' }))
    await user.click(within(filePanel).getByRole('button', { name: 'Generate schema example from file' }))
    await waitFor(() => {
      expect(within(filePanel).getByLabelText('Generated schema example')).toHaveValue('[{"from":"file"}]')
    })
  })
})
