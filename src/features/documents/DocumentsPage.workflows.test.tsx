import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('documents workflows', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('uploads, processes, and inspects chunks', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '' }])
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [{ id: 'doc-1', knowledgeBaseId: 'kb-a', originalFilename: 'd.txt', contentType: 'text/plain', sizeBytes: 10, sha256: 'x', contentUri: 'uri', status: 'UPLOADED', uploadedAt: '', processedAt: null, errorMessage: null }])
      }
      if (url.endsWith('/documents/doc-1/process')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a', originalFilename: 'd.txt', contentType: 'text/plain', sizeBytes: 10, sha256: 'x', contentUri: 'uri', status: 'PROCESSED', uploadedAt: '', processedAt: '', errorMessage: null })
      }
      if (url.endsWith('/documents/doc-1/chunks')) return jsonResponse(200, [{ id: 'chunk-1', documentId: 'doc-1', chunkIndex: 0, text: 'hello', tokenEstimate: 1, metadata: '{}' }])
      return jsonResponse(200, {})
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const file = new File(['hello'], 'd.txt', { type: 'text/plain' })
    const hiddenInput = (await screen.findByTestId('documents-upload-select-file-input')) as HTMLInputElement
    fireEvent.change(hiddenInput, { target: { files: [file] } })

    expect(screen.queryByTestId('documents-endpoint-tabs')).not.toBeInTheDocument()
    expect(screen.getByText('Upload document')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Process' }))
    await user.click(await screen.findByRole('button', { name: 'View chunks' }))

    expect(await screen.findByText(/Selected document: doc-1/i)).toBeInTheDocument()
    expect(screen.getByTestId('output-preview-content')).toHaveClass('overflow-x-auto')
    expect(screen.getByTestId('output-preview-content')).toHaveClass('overflow-y-auto')

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/knowledge-bases/kb-a/documents'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/process'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/chunks'))).toBe(true)
    })
  })
})
