import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch, textResponse } from '../../test/helpers'

const documentFixture = {
  id: 'doc-a',
  knowledgeBaseId: 'kb-a',
  originalFilename: 'a.txt',
  contentType: 'text/plain',
  sizeBytes: 3,
  sha256: 'hash',
  contentUri: 'uri',
  status: 'UPLOADED',
  uploadedAt: '2026-01-01T00:00:00Z',
  processedAt: null,
  errorMessage: null,
}

const localDocument = {
  ...documentFixture,
  localPath: '/var/graphrag/kb-a/a.txt',
  contentUri: 'file:///var/graphrag/kb-a/a.txt',
}

const remoteDocument = {
  ...documentFixture,
  contentUri: 'https://example.test/documents/a.txt',
}

type OpenResponse = ReturnType<typeof jsonResponse> | ReturnType<typeof textResponse>

function renderLocalDocumentPage(openResponse: OpenResponse) {
  const fetchMock = stubFetch((url, init) => {
    if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) return jsonResponse(200, [localDocument])
    if (url === '/__graphrag-ui/open-local-file' && init?.method === 'POST') return openResponse
    throw new Error(`Unexpected request: ${url}`)
  })

  renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
  return fetchMock
}

describe('documents page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('shows process mutation errors while keeping chunk inspection as a handoff', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) return jsonResponse(200, [documentFixture])
      if (url === '/api/v1/documents/doc-a/process?allowOverwrite=false' && init?.method === 'POST') {
        return jsonResponse(400, { detail: 'Process failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Process' }))

    expect(await screen.findByText('Process failed from server')).toBeInTheDocument()
    const inspectLink = screen.getByRole('link', { name: 'Inspect chunking' })
    expect(inspectLink).toHaveAttribute('href', '/chunking?view=chunks&documentId=doc-a')
    expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-a\/chunks(?:$|\?)/.test(String(url)))).toBe(false)
  })

  it('shows overwrite-specific message for a process conflict', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) return jsonResponse(200, [documentFixture])
      if (url === '/api/v1/documents/doc-a/process?allowOverwrite=false' && init?.method === 'POST') {
        return jsonResponse(409, { detail: 'already processed' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Process' }))
    expect(await screen.findByText('Document is already processed. Confirm overwrite to reprocess this file.')).toBeInTheDocument()
  })

  it('preserves source context actions and rows without source metadata', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [localDocument])
      }
      if (url === '/__graphrag-ui/open-local-file' && init?.method === 'POST') return jsonResponse(202, { status: 'OPEN_REQUESTED' })
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    expect(await screen.findByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inspect chunking' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copy path' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('/var/graphrag/kb-a/a.txt'))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/chunks'))).toBe(false)
  })

  it('shows local opening progress, clears prior errors after a retry, and sends the expected request', async () => {
    const user = userEvent.setup()
    let resolveOpen: ((value: Response) => void) | undefined
    let openAttempts = 0
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) return jsonResponse(200, [localDocument])
      if (url === '/__graphrag-ui/open-local-file' && init?.method === 'POST') {
        openAttempts += 1
        if (openAttempts === 1) return jsonResponse(500, { detail: 'The local file could not be opened.' })
        return new Promise<Response>((resolve) => {
          resolveOpen = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Open' }))
    expect(await screen.findByText('The local file could not be opened.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('button', { name: 'Opening...' })).toBeDisabled()
    expect(screen.queryByText('The local file could not be opened.')).not.toBeInTheDocument()
    resolveOpen?.(jsonResponse(202, { status: 'OPEN_REQUESTED' }) as Response)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toBeEnabled())
    expect(await screen.findByText('Document opened in another window')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/__graphrag-ui/open-local-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: localDocument.localPath }),
    })
  })

  it('opens supported browser sources in a separate window', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) return jsonResponse(200, [remoteDocument])
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Open' }))

    expect(openSpy).toHaveBeenCalledWith(remoteDocument.contentUri, '_blank', 'noopener,noreferrer')
    expect(screen.queryByText('Open failed')).not.toBeInTheDocument()
  })

  it('shows fallback guidance when the browser blocks a document popup', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) return jsonResponse(200, [remoteDocument])
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Open' }))

    expect(await screen.findByText('The browser blocked opening this document. Copy the source path and open it locally.')).toBeInTheDocument()
  })

  it.each([
    {
      name: 'structured error detail',
      response: jsonResponse(500, { detail: 'The local file could not be opened.' }),
      message: 'The local file could not be opened.',
    },
    {
      name: 'malformed error body',
      response: textResponse(500, '{not-json'),
      message: 'Unable to open local file. Copy the source path and open it locally.',
    },
    {
      name: '404 fallback guidance',
      response: jsonResponse(404, { message: 'Route not found' }),
      message: 'Local file opening is not available from this server. Copy the source path and open it locally.',
    },
    {
      name: 'generic failure guidance',
      response: jsonResponse(500, { message: 'Unexpected opener failure' }),
      message: 'Unable to open local file. Copy the source path and open it locally.',
    },
  ])('shows $name and preserves the local-file request contract', async ({ response, message }) => {
    const user = userEvent.setup()
    const fetchMock = renderLocalDocumentPage(response)

    await user.click(await screen.findByRole('button', { name: 'Open' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.queryByText('Document opened in another window')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/__graphrag-ui/open-local-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: localDocument.localPath }),
    })
  })

  it('does not call document endpoints without a selected knowledge base', () => {
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: null })
    expect(screen.getByText('No knowledge base selected')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
