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
})
