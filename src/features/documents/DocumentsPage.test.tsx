import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('documents page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('shows process mutation error and chunk query error alerts', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
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
          },
        ])
      }
      if (url === '/api/v1/documents/doc-a/process?allowOverwrite=false' && init?.method === 'POST') {
        return jsonResponse(400, { detail: 'Process failed from server' })
      }
      if (url === '/api/v1/documents/doc-a/chunks' && !init?.method) {
        return jsonResponse(400, { detail: 'Chunks failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Process' }))
    await waitFor(() => {
      expect(screen.getByText('Process failed')).toBeInTheDocument()
      expect(screen.getByText('Process failed from server')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'View chunks' }))
    await waitFor(() => {
      expect(screen.getByText('Load chunks failed')).toBeInTheDocument()
      expect(screen.getByText('Chunks failed from server')).toBeInTheDocument()
    })
  })

  it('shows overwrite-specific message for 409 conflict response', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
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
          },
        ])
      }
      if (url === '/api/v1/documents/doc-a/process?allowOverwrite=false' && init?.method === 'POST') {
        return jsonResponse(409, { detail: 'already processed' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Process' }))
    await waitFor(() => {
      expect(screen.getByText('Process failed')).toBeInTheDocument()
      expect(screen.getByText('Document is already processed. Confirm overwrite to reprocess this file.')).toBeInTheDocument()
    })
  })

  it('shows document chunks in readable mode by default with key chunk fields', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-a',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.txt',
            contentType: 'text/plain',
            sizeBytes: 3,
            sha256: 'hash',
            contentUri: 'uri',
            status: 'COMPLETED',
            uploadedAt: '2026-01-01T00:00:00Z',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url === '/api/v1/documents/doc-a/chunks' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'chunk-a',
            documentId: 'doc-a',
            chunkIndex: 7,
            text: 'First line\nSecond line with extracted document text',
            tokenEstimate: 42,
            metadata: '{"source":"manual.pdf"}',
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'View chunks' }))

    expect(await screen.findByTestId('document-chunks-readable-view')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Readable view' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Raw JSON' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Chunk 7')).toBeInTheDocument()
    expect(screen.getByText('ID: chunk-a')).toBeInTheDocument()
    expect(screen.getByText('42 tokens')).toBeInTheDocument()
    expect(screen.getByText('manual.pdf')).toBeInTheDocument()
    expect(screen.getByText(/Second line with extracted document text/)).toBeInTheDocument()
    expect(screen.queryByTestId('output-preview-content')).not.toBeInTheDocument()
  })

  it('switches between raw JSON and readable chunk views without refetching chunks', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-a',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.txt',
            contentType: 'text/plain',
            sizeBytes: 3,
            sha256: 'hash',
            contentUri: 'uri',
            status: 'COMPLETED',
            uploadedAt: '2026-01-01T00:00:00Z',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url === '/api/v1/documents/doc-a/chunks' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'chunk-a',
            documentId: 'doc-a',
            chunkIndex: 0,
            text: 'raw mode text',
            tokenEstimate: 5,
            metadata: '{"source":"source.txt"}',
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'View chunks' }))
    expect(await screen.findByTestId('document-chunks-readable-view')).toBeInTheDocument()

    const chunkRequestsBeforeToggle = fetchMock.mock.calls.filter((call) => String(call[0]) === '/api/v1/documents/doc-a/chunks')
    expect(chunkRequestsBeforeToggle).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Raw JSON' }))
    expect(screen.getByRole('button', { name: 'Raw JSON' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('output-preview-content')).toHaveClass('overflow-x-auto')
    expect(screen.getByTestId('output-preview-content')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('output-preview-content')).toHaveTextContent('"text": "raw mode text"')

    await user.click(screen.getByRole('button', { name: 'Readable view' }))
    expect(screen.getByRole('button', { name: 'Readable view' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('document-chunks-readable-view')).toBeInTheDocument()
    expect(screen.queryByTestId('output-preview-content')).not.toBeInTheDocument()

    const chunkRequestsAfterToggle = fetchMock.mock.calls.filter((call) => String(call[0]) === '/api/v1/documents/doc-a/chunks')
    expect(chunkRequestsAfterToggle).toHaveLength(1)
  })

  it('renders source context and supports open and copy path actions', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const fetchMock = stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-a',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.txt',
            contentType: 'text/plain',
            sizeBytes: 3,
            sha256: 'hash',
            contentUri: 'file:///var/graphrag/kb-a/a.txt',
            localPath: '/var/graphrag/kb-a/a.txt',
            status: 'UPLOADED',
            uploadedAt: '2026-01-01T00:00:00Z',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url === '/__graphrag-ui/open-local-file' && init?.method === 'POST') {
        return jsonResponse(202, { status: 'OPEN_REQUESTED' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy path' })).toBeInTheDocument()
    expect(screen.queryByText('/var/graphrag/kb-a/a.txt')).not.toBeInTheDocument()

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const openCall = fetchMock.mock.calls.find((call) => String(call[0]) === '/__graphrag-ui/open-local-file')
    expect(openCall).toBeTruthy()
    expect((openCall?.[1] as RequestInit).body).toBe(JSON.stringify({ path: '/var/graphrag/kb-a/a.txt' }))
    expect(screen.queryByText('/var/graphrag/kb-a/a.txt')).not.toBeInTheDocument()
    expect(screen.getByText('Open requested')).toBeInTheDocument()
    expect(screen.getByText('Document opened in another window')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.queryByText('Document opened in another window')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy path' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith('/var/graphrag/kb-a/a.txt')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('shows open failure feedback when local open helper is unavailable', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-a',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.txt',
            contentType: 'text/plain',
            sizeBytes: 3,
            sha256: 'hash',
            contentUri: 'file:///var/graphrag/kb-a/a.txt',
            localPath: '/var/graphrag/kb-a/a.txt',
            status: 'UPLOADED',
            uploadedAt: '2026-01-01T00:00:00Z',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url === '/__graphrag-ui/open-local-file' && init?.method === 'POST') {
        return jsonResponse(404, { detail: 'Local file opening is not available from this server.' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Open' }))

    expect(await screen.findByText('Open failed')).toBeInTheDocument()
    expect(screen.getByText('Local file opening is not available from this server.')).toBeInTheDocument()
    expect(screen.queryByText('/var/graphrag/kb-a/a.txt')).not.toBeInTheDocument()
  })

  it('keeps rows usable when no source context is available', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [
          {
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
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('a.txt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Process' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy path' })).not.toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })

  it('does not call document endpoints without selected knowledge base', () => {
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: null })

    expect(screen.getByText('No knowledge base selected')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
