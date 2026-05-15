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
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
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
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/process?allowOverwrite=false'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/chunks'))).toBe(true)
    })
  })

  it('shows confirmation dialog for completed documents and respects accept/decline', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'd.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'SUCCESSFULLY_PROCESSED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=true')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    confirmSpy.mockReturnValueOnce(false).mockReturnValueOnce(true)

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    const processButton = await screen.findByRole('button', { name: 'Process' })

    await user.click(processButton)
    await user.click(processButton)

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(2)
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/process?allowOverwrite=true'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/process?allowOverwrite=false'))).toBe(false)
    })
  })

  it('prompts on backend 409 and retries with overwrite true', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'd.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'FAILED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return jsonResponse(409, { detail: 'already processed' })
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=true')) {
        return jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Process' }))

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled()
      const urls = fetchMock.mock.calls.map((c) => String(c[0]))
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/process?allowOverwrite=false'))).toBe(true)
      expect(urls.some((u) => u.endsWith('/api/v1/documents/doc-1/process?allowOverwrite=true'))).toBe(true)
    })
  })

  it('shows pending state only for the clicked process row', async () => {
    let resolveProcess: ((value: Response) => void) | null = null
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
          {
            id: 'doc-2',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'b.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'y',
            contentUri: 'uri2',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return new Promise<Response>((resolve) => {
          resolveProcess = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const processButtons = await screen.findAllByRole('button', { name: 'Process' })
    await user.click(processButtons[0])

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Processing...' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(1)
    })

    resolveProcess?.(jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' }))
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(2)
    })
  })

  it('keeps pending state independent across rows when processing concurrently', async () => {
    let resolveDoc1: ((value: Response) => void) | null = null
    let resolveDoc2: ((value: Response) => void) | null = null
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
          {
            id: 'doc-2',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'b.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'y',
            contentUri: 'uri2',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        return new Promise<Response>((resolve) => {
          resolveDoc1 = resolve
        })
      }
      if (url.endsWith('/documents/doc-2/process?allowOverwrite=false')) {
        return new Promise<Response>((resolve) => {
          resolveDoc2 = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    let processButtons = await screen.findAllByRole('button', { name: 'Process' })
    await user.click(processButtons[0])
    processButtons = await screen.findAllByRole('button', { name: 'Process' })
    await user.click(processButtons[0])

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Processing...' })).toHaveLength(2)
    })

    resolveDoc1?.(jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' }))
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Processing...' })).toHaveLength(1)
      expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(1)
    })

    resolveDoc2?.(jsonResponse(200, { id: 'doc-2', knowledgeBaseId: 'kb-a' }))
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(2)
    })
  })
})
