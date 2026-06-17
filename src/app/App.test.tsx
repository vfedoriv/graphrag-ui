import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('app shell', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '[]' })
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders sidebar entries and navigates to schemas', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('GraphRAG UI')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Schemas/i }))

    expect(await screen.findByRole('heading', { name: 'Schemas' })).toBeInTheDocument()
  })

  it('does not call dedicated health endpoint', async () => {
    render(<App />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(calledUrls.some((url) => url.includes('/health'))).toBe(false)
    expect(calledUrls.some((url) => url.includes('/knowledge-bases'))).toBe(true)
  })

  it('clears stale persisted knowledge base selection after list loads', async () => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'missing-kb')
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }]),
    })

    render(<App />)

    expect(await screen.findByText('None selected')).toBeInTheDocument()
    await waitFor(() => {
      expect(localStorage.getItem('graphrag.selectedKnowledgeBase')).toBeNull()
    })
  })

  it('keeps valid persisted knowledge base selection after list loads', async () => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'kb-a')
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }]),
    })

    render(<App />)

    expect((await screen.findAllByText('KB A (kb-a)')).length).toBeGreaterThan(0)
    expect(localStorage.getItem('graphrag.selectedKnowledgeBase')).toBe('kb-a')
  })

  it('does not clear persisted knowledge base selection while list load fails', async () => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'kb-a')
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ detail: 'backend unavailable' }),
      json: async () => ({ detail: 'backend unavailable' }),
    })

    render(<App />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(localStorage.getItem('graphrag.selectedKnowledgeBase')).toBe('kb-a')
  })

  it('does not clear persisted knowledge base selection while list is loading', async () => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'kb-a')
    fetchMock.mockReturnValue(new Promise(() => undefined))

    render(<App />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(localStorage.getItem('graphrag.selectedKnowledgeBase')).toBe('kb-a')
  })
})
