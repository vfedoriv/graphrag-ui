import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeBasesPage } from './KnowledgeBasesPage'
import { renderWithProviders } from '../../test/helpers'

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
})
