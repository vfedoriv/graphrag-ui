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

  it('changes and persists appearance without resetting workspace context', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }]),
    })

    const { container } = render(<App />)

    const appearance = await screen.findByRole('combobox', { name: 'Appearance' })
    expect((await screen.findAllByText('KB A (kb-a)')).length).toBeGreaterThan(0)
    const workspace = screen.getByRole('combobox', { name: 'knowledge-base-selector' })
    await user.selectOptions(workspace, 'kb-a')
    const routeBeforeThemeChange = window.location.pathname
    expect(appearance).toHaveValue('system')
    await user.selectOptions(appearance, 'light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(container.querySelector('main')).toBeInTheDocument()
    expect(container.querySelector('.panel')).toBeInTheDocument()
    expect(container.querySelector('.button')).toBeInTheDocument()
    await user.selectOptions(appearance, 'dark')

    expect(appearance).toHaveValue('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('graphrag.appearance')).toBe('dark')
    expect(workspace).toHaveValue('kb-a')
    expect(window.location.pathname).toBe(routeBeforeThemeChange)
  })

  it('keeps the app shell visible while lazy routes load', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('GraphRAG UI')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Settings/i }))

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
  })

  it('navigates to AI Providers and marks its primary destination active', async () => {
    const user = userEvent.setup()
    render(<App />)

    const link = await screen.findByRole('link', { name: /AI Providers/i })
    await user.click(link)

    expect(await screen.findByRole('heading', { name: 'AI Providers' })).toBeInTheDocument()
    expect(link).toHaveClass('active')
    expect(window.location.pathname).toBe('/ai-providers')
  })

  it('renders direct AI Providers URLs through the application shell', async () => {
    window.history.pushState({}, '', '/ai-providers')
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'AI Providers' })).toBeInTheDocument()
    expect(screen.getByText('GraphRAG UI')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /AI Providers/i })).toHaveClass('active')
  })

  it('navigates to schema builder from the sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('link', { name: /Schema Builder/i }))

    expect(await screen.findByRole('heading', { name: 'Schema Builder' })).toBeInTheDocument()
  })

  it('navigates to Chunking after Documents and normalizes the default strategy view', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const labels = Array.from(nav.querySelectorAll('a')).map((link) => link.textContent?.trim())
    expect(labels).toEqual([
      'Dashboard',
      'Knowledge Bases',
      'Schemas',
      'Schema Builder',
      'Schema Drafts',
      'Documents',
      'Chunking',
      'Queries',
      'AI Providers',
      'Settings',
    ])

    await user.click(screen.getByRole('link', { name: 'Chunking' }))

    expect(await screen.findByRole('heading', { name: 'Chunking' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chunking' })).toHaveClass('active')
    expect(screen.getByRole('tab', { name: 'Strategy' })).toHaveAttribute('aria-selected', 'true')
    expect(window.location.pathname).toBe('/chunking')
    expect(window.location.search).toBe('?view=strategy')
    expect(screen.getByText('Scope: Global')).toBeInTheDocument()
  })

  it('normalizes unsupported Chunking views while keeping Strategy available without a knowledge base', async () => {
    window.history.pushState({}, '', '/chunking?view=unknown')
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Strategy' })).toBeInTheDocument()
    await waitFor(() => expect(window.location.search).toBe('?view=strategy'))
    expect(screen.getByText('Selected workspace: None selected')).toBeInTheDocument()
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
