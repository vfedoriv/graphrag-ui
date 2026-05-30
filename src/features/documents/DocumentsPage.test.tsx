import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('documents page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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

  it('does not call document endpoints without selected knowledge base', () => {
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: null })

    expect(screen.getByText('No knowledge base selected')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
