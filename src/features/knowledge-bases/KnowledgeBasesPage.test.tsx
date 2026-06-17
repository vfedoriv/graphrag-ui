import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeBasesPage } from './KnowledgeBasesPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('knowledge bases page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates and selects knowledge base', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '[]' })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }]),
      })
    vi.stubGlobal('fetch', fetchMock)

    renderWithProviders(<KnowledgeBasesPage />)

    await user.type(screen.getByPlaceholderText('id (kb-demo)'), 'kb-a')
    await user.type(screen.getByPlaceholderText('name'), 'KB A')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/knowledge-bases', expect.anything()))
  })

  it('shows active schema name instead of schema id', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, [
          { id: 'kb-a', name: 'KB A', activeSchemaId: 'schema-a', createdAt: '2026-01-01T00:00:00Z' },
        ])
      }
      if (url === '/api/v1/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Claim event',
            version: 3,
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

    renderWithProviders(<KnowledgeBasesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('Claim event')).toBeInTheDocument()
    expect(screen.queryByText('schema-a')).not.toBeInTheDocument()
  })

  it('shows update error alert when inline rename fails', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }])
      }
      if (url === '/api/v1/knowledge-bases/kb-a' && init?.method === 'PUT') {
        return jsonResponse(400, { detail: 'Rename failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<KnowledgeBasesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const nameInput = await screen.findByLabelText('name-kb-a')
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed KB')
    nameInput.blur()

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
      expect(screen.getByText('Rename failed from server')).toBeInTheDocument()
    })
  })

  it('shows delete error alert when delete mutation fails', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }])
      }
      if (url === '/api/v1/knowledge-bases/kb-a' && init?.method === 'DELETE') {
        return jsonResponse(400, { detail: 'Delete failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<KnowledgeBasesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument()
      expect(screen.getByText('Delete failed from server')).toBeInTheDocument()
    })
  })

  it('does not send update request when inline name is unchanged on blur', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }])
      }
      if (url === '/api/v1/knowledge-bases/kb-a' && init?.method === 'PUT') {
        return jsonResponse(200, { id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<KnowledgeBasesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const nameInput = await screen.findByLabelText('name-kb-a')
    expect((nameInput as HTMLInputElement).value).toBe('KB A')
    await user.click(nameInput)
    nameInput.blur()

    expect(fetchMock).not.toHaveBeenCalledWith('/api/v1/knowledge-bases/kb-a', expect.objectContaining({ method: 'PUT' }))
  })

  it('keeps row input identity stable after deleting another row', async () => {
    const user = userEvent.setup()
    let knowledgeBases = [
      { id: 'kb-a', name: 'Alpha', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'kb-b', name: 'Beta', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' },
    ]

    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, knowledgeBases)
      }
      if (url === '/api/v1/knowledge-bases/kb-a' && init?.method === 'DELETE') {
        knowledgeBases = knowledgeBases.filter((kb) => kb.id !== 'kb-a')
        return jsonResponse(204, {})
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<KnowledgeBasesPage />, { selectedKnowledgeBaseId: 'kb-b' })

    expect((await screen.findByLabelText('name-kb-b')).getAttribute('value')).toBe('Beta')
    await user.click((await screen.findAllByRole('button', { name: 'Delete' }))[0])

    await waitFor(() => {
      const remainingInput = screen.getByLabelText('name-kb-b') as HTMLInputElement
      expect(remainingInput.value).toBe('Beta')
      expect(screen.queryByLabelText('name-kb-a')).not.toBeInTheDocument()
    })
  })

  it('clears selected knowledge base after deleting the selected row', async () => {
    const user = userEvent.setup()
    let knowledgeBases = [
      { id: 'kb-a', name: 'Alpha', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' },
      { id: 'kb-b', name: 'Beta', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' },
    ]

    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, knowledgeBases)
      }
      if (url === '/api/v1/knowledge-bases/kb-a' && init?.method === 'DELETE') {
        knowledgeBases = knowledgeBases.filter((kb) => kb.id !== 'kb-a')
        return jsonResponse(204, {})
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<KnowledgeBasesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('Selected', { selector: 'span' })).toBeInTheDocument()
    await user.click((await screen.findAllByRole('button', { name: 'Delete' }))[0])

    await waitFor(() => {
      expect(screen.queryByText('Selected', { selector: 'span' })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('name-kb-a')).not.toBeInTheDocument()
    })
  })
})
