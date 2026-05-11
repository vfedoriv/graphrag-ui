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

  it('renders sidebar entries and navigates to queries', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByText('GraphRAG UI')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Queries/i }))

    expect(await screen.findByRole('heading', { name: 'Queries' })).toBeInTheDocument()
  })

  it('does not call dedicated health endpoint', async () => {
    render(<App />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(calledUrls.some((url) => url.includes('/health'))).toBe(false)
    expect(calledUrls.some((url) => url.includes('/knowledge-bases'))).toBe(true)
  })
})
