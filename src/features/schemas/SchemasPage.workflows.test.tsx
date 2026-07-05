import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemasPage } from './SchemasPage'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('schemas workflows', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('runs validate, create, and row details flows from purpose sections', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/schemas') && init?.method === 'POST') return jsonResponse(200, { id: 'created-schema' })
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
        return jsonResponse(200, [
          { id: 'schema-1', name: 'S', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' },
        ])
      }
      if (url.endsWith('/schemas/validate')) return jsonResponse(200, { valid: true, errors: [] })
      if (url.endsWith('/schemas/schema-1')) return jsonResponse(200, { id: 'schema-1', name: 'S', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' })
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByTestId('schemas-purpose-tabs-tab-schema-validation'))
    const validatePanel = await screen.findByTestId('schema-validation-section')
    fireEvent.change(within(validatePanel).getByLabelText('Mock structured JSON data'), { target: { value: '{"type":"object"}' } })
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema JSON' }))

    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Details' }))
    expect(await screen.findByDisplayValue(/"id": "schema-1"/)).toBeInTheDocument()

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/schemas/validate'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/schemas/schema-1'))).toBe(true)
    })

    const validateCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/v1/schemas/validate'))
    const validatePayload = JSON.parse(String((validateCall?.[1] as RequestInit | undefined)?.body)) as { content: string }
    expect(JSON.parse(validatePayload.content)).toEqual({ type: 'object' })

    await user.click(screen.getByTestId('schemas-purpose-tabs-tab-schema-creation'))
    const createPanel = screen.getByTestId('schema-creation-section')
    await user.click(within(createPanel).getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/api/v1/schemas') && (init as RequestInit | undefined)?.method === 'POST')
      const createPayload = JSON.parse(String((createCall?.[1] as RequestInit | undefined)?.body)) as { content: string, sourceType: string }
      expect(JSON.parse(createPayload.content)).toEqual({ type: 'object' })
      expect(createPayload.sourceType).toBe('PREDEFINED')
    })
  })

  it('refreshes the selected knowledge base schema list after creating a schema', async () => {
    let createCompleted = false
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
        return jsonResponse(
          200,
          createCompleted
            ? [
                {
                  id: 'created-schema',
                  name: 'generated-schema-7',
                  version: 1,
                  sourceType: 'PREDEFINED',
                  format: 'JSON',
                  contentHash: 'hash',
                  status: 'INACTIVE',
                  createdAt: '2026-06-16T18:35:41Z',
                },
              ]
            : [],
        )
      }
      if (url.endsWith('/schemas') && init?.method === 'POST') {
        createCompleted = true
        return jsonResponse(200, { id: 'created-schema' })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('No Schemas for selected knowledge base')).toBeInTheDocument()

    await user.click(screen.getByTestId('schemas-purpose-tabs-tab-schema-creation'))
    const createPanel = screen.getByTestId('schema-creation-section')
    fireEvent.change(within(createPanel).getByLabelText('Mock structured JSON data'), {
      target: { value: '{"name":"generated-schema-7","version":1}' },
    })
    await user.click(within(createPanel).getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('generated-schema-7')).toBeInTheDocument()
    expect(screen.queryByText('created-schema')).not.toBeInTheDocument()

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/v1/schemas') && (init as RequestInit | undefined)?.method === 'POST',
    )
    const createPayload = JSON.parse(String((createCall?.[1] as RequestInit | undefined)?.body)) as {
      content: string
      sourceType: string
      knowledgeBaseId: string
    }
    expect(JSON.parse(createPayload.content)).toEqual({ name: 'generated-schema-7', version: 1 })
    expect(createPayload).toEqual({
      content: expect.any(String),
      sourceType: 'PREDEFINED',
      knowledgeBaseId: 'kb-a',
    })
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/v1/knowledge-bases/kb-a/schemas')).length).toBeGreaterThanOrEqual(2)
  })

  it('shows create conflict errors without reporting success', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/schemas') && init?.method === 'POST') {
        return jsonResponse(409, { detail: 'Schema version is immutable and already exists for name=generated-schema-7, version=1' })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByTestId('schemas-purpose-tabs-tab-schema-creation'))
    const createPanel = await screen.findByTestId('schema-creation-section')
    fireEvent.change(within(createPanel).getByLabelText('Mock structured JSON data'), {
      target: { value: '{"name":"generated-schema-7","version":1}' },
    })
    await user.click(within(createPanel).getByRole('button', { name: 'Create' }))

    expect(await within(createPanel).findByText('Create failed')).toBeInTheDocument()
    expect(
      within(createPanel).getByText('Schema version is immutable and already exists for name=generated-schema-7, version=1'),
    ).toBeInTheDocument()
    expect(screen.queryByText('generated-schema-7')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/api/v1/knowledge-bases/kb-a/schemas')).length).toBe(1)
  })

  it('shows response outputs for schema JSON generation sections and replaces row details output with latest response', async () => {
    let getByIdCount = 0
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
        return jsonResponse(200, [
          { id: 'schema-1', name: 'Schema One', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' },
        ])
      }
      if (url.endsWith('/schemas/generate') && init?.method === 'POST') {
        return jsonResponse(200, {
          content: '{"name":"generated-schema","version":1}',
          warnings: [{ code: 'LOW_CONFIDENCE', message: 'Generated schema may need review.', suggestion: 'Check extracted fields.' }],
        })
      }
      if (url.endsWith('/schemas/generate/from-file') && init?.method === 'POST') {
        return jsonResponse(200, {
          content: '{"name":"generated-schema","version":1}',
          warnings: [{ code: 'FILE_TRUNCATED', message: 'Only part of the file was used.' }],
        })
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

    await user.click(await screen.findByTestId('schemas-purpose-tabs-tab-schema-json-generation'))
    const generateJsonPanel = await screen.findByTestId('schemas-workflow-generate-schema-json')
    await user.type(within(generateJsonPanel).getByLabelText('Source text'), 'customer record')
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Generate schema JSON' }))
    await waitFor(() => {
      expect(within(generateJsonPanel).getByLabelText('Mock structured JSON data')).toHaveValue('{\n  "name": "generated-schema",\n  "version": 1\n}')
    })
    expect(within(generateJsonPanel).getByText('Schema generation warnings')).toBeInTheDocument()
    expect(within(generateJsonPanel).getByText(/LOW_CONFIDENCE/)).toBeInTheDocument()
    expect(within(generateJsonPanel).getByText(/Check extracted fields/)).toBeInTheDocument()
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Open in Builder' }))
    expect(sessionStorage.getItem('graphrag.schemaBuilderDraft')).toBe('{"name":"generated-schema","version":1}')
    expect(window.location.pathname).toBe('/schema-builder')
    expect(window.location.search).toBe('?draft=session')

    const jsonSection = screen.getByTestId('schema-json-generation-section')
    await user.click(within(jsonSection).getByLabelText('From file', { selector: 'input' }))
    const generateJsonFilePanel = screen.getByTestId('schemas-workflow-generate-schema-json-file')
    const sourceFileInput = within(generateJsonFilePanel).getByTestId('schemas-json-file-select-input')
    await user.upload(sourceFileInput, new File(['customer record'], 'customer.txt', { type: 'text/plain' }))
    await user.click(within(generateJsonFilePanel).getByRole('button', { name: 'Generate schema JSON from file' }))
    await waitFor(() => {
      expect(within(generateJsonFilePanel).getByLabelText('Mock structured JSON data')).toHaveValue('{\n  "name": "generated-schema",\n  "version": 1\n}')
    })
    expect(within(generateJsonFilePanel).getByText('Schema generation warnings')).toBeInTheDocument()
    expect(within(generateJsonFilePanel).getByText(/FILE_TRUNCATED/)).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Details' }))
    expect(await screen.findByDisplayValue(/"name": "first"/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(await screen.findByDisplayValue(/"name": "second"/)).toBeInTheDocument()
  })

  it('shows row details error feedback without manual schema id entry', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
        return jsonResponse(200, [
          { id: 'schema-ok', name: 'Schema OK', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'INACTIVE', createdAt: '' },
          { id: 'schema-fail', name: 'Schema Fail', version: 2, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'INACTIVE', createdAt: '' },
        ])
      }
      if (url.endsWith('/schemas/schema-ok') && !init?.method) {
        return jsonResponse(200, { id: 'schema-ok', name: 'Schema OK', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'INACTIVE', createdAt: '' })
      }
      if (url.endsWith('/schemas/schema-fail') && !init?.method) {
        return jsonResponse(404, { detail: 'Schema detail lookup failed from server' })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const detailButtons = await screen.findAllByRole('button', { name: 'Details' })
    await user.click(detailButtons[0])
    expect(await screen.findByDisplayValue(/"id": "schema-ok"/)).toBeInTheDocument()

    await user.click(detailButtons[1])
    expect(await screen.findByText('Get schema failed')).toBeInTheDocument()
    expect(screen.getByText('Schema detail lookup failed from server')).toBeInTheDocument()
    expect(screen.queryByLabelText('Schema ID')).not.toBeInTheDocument()

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map(([url]) => String(url))
      expect(urls.some((url) => url.endsWith('/api/v1/schemas/schema-ok'))).toBe(true)
      expect(urls.some((url) => url.endsWith('/api/v1/schemas/schema-fail'))).toBe(true)
    })
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

    await user.click(await screen.findByTestId('schemas-purpose-tabs-tab-schema-json-generation'))
    const generateJsonPanel = await screen.findByTestId('schemas-workflow-generate-schema-json')
    await user.type(within(generateJsonPanel).getByLabelText('Source text'), 'customer record')
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Generate schema JSON' }))

    const output = await within(generateJsonPanel).findByLabelText('Mock structured JSON data')
    fireEvent.change(output, { target: { value: '{"name":"edited"}' } })
    await user.click(within(generateJsonPanel).getByRole('button', { name: 'Generate schema JSON' }))

    expect(await within(generateJsonPanel).findByText('Generation failed from server')).toBeInTheDocument()
    expect(output).toHaveValue('{\n  "name": "edited"\n}')

    await user.click(screen.getByTestId('schemas-purpose-tabs-tab-schema-validation'))
    const validatePanel = screen.getByTestId('schema-validation-section')
    await user.click(within(validatePanel).getByRole('button', { name: 'Validate schema JSON' }))
    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    const validateCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/v1/schemas/validate'))
    const validatePayload = JSON.parse(String((validateCall?.[1] as RequestInit | undefined)?.body)) as { content: string }
    expect(JSON.parse(validatePayload.content)).toEqual({ name: 'edited' })
  })

  it('renders normalized schema example output for text and file sections', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/schemas/generate/example') && init?.method === 'POST') return jsonResponse(200, '[{"from":"text"}]')
      if (url.endsWith('/schemas/generate/example/from-file') && init?.method === 'POST') return jsonResponse(200, { example: '[{"from":"file"}]' })
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const textPanel = await screen.findByTestId('schemas-workflow-generate-schema-example-text')
    await user.type(within(textPanel).getByLabelText('Source text'), 'bio')
    await user.click(within(textPanel).getByRole('button', { name: 'Generate schema example' }))
    await waitFor(() => {
      expect(within(textPanel).getByLabelText('Generated schema example')).toHaveValue('[{"from":"text"}]')
    })

    const exampleSection = screen.getByTestId('schema-example-generation-section')
    await user.click(within(exampleSection).getByLabelText('From file', { selector: 'input' }))
    const filePanel = screen.getByTestId('schemas-workflow-generate-schema-example-file')
    const sourceFileInput = within(filePanel).getByTestId('schemas-example-file-select-input')
    await user.upload(sourceFileInput, new File(['bio'], 'bio.txt', { type: 'text/plain' }))
    await user.click(within(filePanel).getByRole('button', { name: 'Generate schema example from file' }))
    await waitFor(() => {
      expect(within(filePanel).getByLabelText('Generated schema example')).toHaveValue('[{"from":"file"}]')
    })
  })

  it('loads schema content for update, saves edits, and preserves draft on update failure', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
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
      if (url.endsWith('/schemas/schema-a') && !init?.method) {
        return jsonResponse(200, {
          id: 'schema-a',
          name: 'Schema A',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'hash',
          status: 'INACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
          content: '{"name":"Schema A","version":1}',
        })
      }
      if (url.endsWith('/schemas/schema-a') && init?.method === 'PUT') {
        return jsonResponse(409, { detail: 'Schema identity conflict from server' })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Update' }))
    expect(await screen.findByText('Update schema')).toBeInTheDocument()
    const editor = screen.getAllByLabelText('Mock structured JSON data')[0]
    fireEvent.change(editor, { target: { value: '{"name":"Schema A","version":1,"description":"edited"}' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Update failed')).toBeInTheDocument()
    expect(screen.getByText('Schema identity conflict from server')).toBeInTheDocument()
    expect(editor).toHaveValue('{\n  "name": "Schema A",\n  "version": 1,\n  "description": "edited"\n}')

    const updateCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/v1/schemas/schema-a') && (init as RequestInit | undefined)?.method === 'PUT',
    )
    const updatePayload = JSON.parse(String((updateCall?.[1] as RequestInit | undefined)?.body)) as { content: string, sourceType: string }
    expect(JSON.parse(updatePayload.content)).toEqual({ name: 'Schema A', version: 1, description: 'edited' })
    expect(updatePayload.sourceType).toBe('PREDEFINED')
  })

  it('cancels schema update without sending a PUT request', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
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
      if (url.endsWith('/schemas/schema-a') && !init?.method) {
        return jsonResponse(200, {
          id: 'schema-a',
          name: 'Schema A',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'hash',
          status: 'INACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
          content: '{"name":"Schema A","version":1}',
        })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Update' }))
    expect(await screen.findByText('Update schema')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Update schema')).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => String(url).endsWith('/api/v1/schemas/schema-a') && (init as RequestInit | undefined)?.method === 'PUT',
      ),
    ).toBe(false)
  })

  it('confirms schema delete, skips deletion when canceled, and shows delete failures', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockReturnValueOnce(false).mockReturnValueOnce(true)
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
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
      if (url.endsWith('/schemas/schema-a') && init?.method === 'DELETE') {
        return jsonResponse(409, { detail: 'Schema is active from server' })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const deleteButton = await screen.findByRole('button', { name: 'Delete' })
    await user.click(deleteButton)
    expect(confirmSpy).toHaveBeenCalledWith('Delete schema Schema A v1 (schema-a)?')
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) => String(url).endsWith('/api/v1/schemas/schema-a') && (init as RequestInit | undefined)?.method === 'DELETE',
      ),
    ).toBe(false)

    await user.click(deleteButton)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/schemas/schema-a', expect.objectContaining({ method: 'DELETE' }))
    })
    expect(await screen.findByText('Delete failed')).toBeInTheDocument()
    expect(screen.getByText('Schema Schema A v1 (schema-a): Schema is active from server')).toBeInTheDocument()
  })

  it('clears schema mutation alerts when selected knowledge base changes', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Schema A',
            version: 1,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash-a',
            status: 'INACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url.endsWith('/knowledge-bases/kb-b/schemas') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-b',
            name: 'Schema B',
            version: 1,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash-b',
            status: 'INACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url.endsWith('/schemas/schema-a') && !init?.method) {
        return jsonResponse(200, {
          id: 'schema-a',
          name: 'Schema A',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'hash-a',
          status: 'INACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
          content: '{"name":"Schema A","version":1}',
        })
      }
      if (url.endsWith('/schemas/schema-a') && init?.method === 'PUT') {
        return jsonResponse(409, { detail: 'Cannot update active schema: schema-a' })
      }
      if (url.endsWith('/schemas/schema-a') && init?.method === 'DELETE') {
        return jsonResponse(409, { detail: 'Cannot delete active schema: schema-a' })
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? 'GET'}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<SchemasPageWithKnowledgeBaseSwitcher />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Update' }))
    await user.click(await screen.findByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Update failed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('Delete failed')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch knowledge base' }))

    expect(await screen.findByText('Schema B')).toBeInTheDocument()
    expect(screen.queryByText('schema-b')).not.toBeInTheDocument()
    expect(screen.queryByText('Update failed')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete failed')).not.toBeInTheDocument()
    expect(screen.queryByText(/Cannot update active schema/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Cannot delete active schema/)).not.toBeInTheDocument()
  })
})

function SchemasPageWithKnowledgeBaseSwitcher() {
  const { setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()

  return (
    <>
      <button type='button' onClick={() => setSelectedKnowledgeBaseId('kb-b')}>
        Switch knowledge base
      </button>
      <SchemasPage />
    </>
  )
}
