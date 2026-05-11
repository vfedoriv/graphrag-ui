import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { KnowledgeBasesPage } from './KnowledgeBasesPage'
import { SelectedKnowledgeBaseProvider } from '../../shared/state/selectedKnowledgeBase'

function wrapper(children: ReactNode) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <SelectedKnowledgeBaseProvider>{children}</SelectedKnowledgeBaseProvider>
    </QueryClientProvider>
  )
}

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

    render(wrapper(<KnowledgeBasesPage />))

    await user.type(screen.getByPlaceholderText('id (kb-demo)'), 'kb-a')
    await user.type(screen.getByPlaceholderText('name'), 'KB A')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/knowledge-bases', expect.anything()))
  })
})
