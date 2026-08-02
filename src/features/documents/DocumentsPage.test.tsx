import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

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

describe('documents page', () => {
  afterEach(() => {
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
        return jsonResponse(200, [{ ...documentFixture, localPath: '/var/graphrag/kb-a/a.txt', contentUri: 'file:///var/graphrag/kb-a/a.txt' }])
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

  it('does not call document endpoints without a selected knowledge base', () => {
    const fetchMock = stubFetch((url) => {
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: null })
    expect(screen.getByText('No knowledge base selected')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
