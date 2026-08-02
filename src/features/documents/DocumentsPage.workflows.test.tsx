import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

const documentFixture = {
  id: 'doc-1',
  knowledgeBaseId: 'kb-a',
  originalFilename: 'd.txt',
  contentType: 'text/plain',
  sizeBytes: 10,
  sha256: 'x',
  contentUri: 'uri',
  status: 'UPLOADED',
  uploadedAt: '',
  processedAt: null,
  errorMessage: null,
}

describe('documents workflows', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('uploads, processes, and hands chunk inspection to the explorer without a complete-list request', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) return jsonResponse(200, [documentFixture])
      if (url.endsWith('/knowledge-bases/kb-a/documents') && init?.method === 'POST') return jsonResponse(201, documentFixture)
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) return jsonResponse(200, { ...documentFixture, status: 'PROCESSED' })
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    const file = new File(['hello'], 'd.txt', { type: 'text/plain' })
    fireEvent.change(await screen.findByTestId('documents-upload-select-file-input'), { target: { files: [file] } })
    await user.click(await screen.findByRole('button', { name: 'Process' }))

    const link = screen.getByRole('link', { name: 'Inspect chunking' })
    expect(link).toHaveAttribute('href', '/chunking?view=chunks&documentId=doc-1')
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-1\/chunks(?:$|\?)/.test(String(url)))).toBe(false)
    })
  })

  it('keeps confirmation and row-specific pending process behavior', async () => {
    let resolveProcess: ((value: Response) => void) | null = null
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          { ...documentFixture, id: 'doc-1', status: 'SUCCESSFULLY_PROCESSED' },
          { ...documentFixture, id: 'doc-2', originalFilename: 'b.txt' },
        ])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=true')) {
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
    expect(confirmSpy).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(1)
    resolveProcess?.(jsonResponse(200, { ...documentFixture, id: 'doc-1', knowledgeBaseId: 'kb-a' }) as Response)
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(2))
  })

  it('loads, saves, clears, and processes document-specific options', async () => {
    const optionsResponse = {
      documentId: 'doc-1',
      parserId: 'tika-pdf',
      fileFormat: 'PDF',
      savedDefaultsUpdatedAt: null,
      options: [{ key: 'maxPages', label: 'Max pages', valueType: 'INTEGER', defaultValue: 10, savedDefaultValue: 3, mutable: true, constraints: { min: 1, max: 20 } }],
    }
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) return jsonResponse(200, [documentFixture])
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) return jsonResponse(200, optionsResponse)
      if (url.endsWith('/documents/doc-1/processing-options/defaults') && init?.method === 'PUT') return jsonResponse(200, optionsResponse)
      if (url.endsWith('/documents/doc-1/processing-options/defaults') && init?.method === 'DELETE') return jsonResponse(200, optionsResponse)
      if (url.endsWith('/documents/doc-1/process') && init?.method === 'POST') return jsonResponse(200, documentFixture)
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Options' }))
    expect(await screen.findByTestId('document-processing-options-workflow')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save defaults' }))
    await user.click(screen.getByRole('button', { name: 'Clear defaults' }))
    await user.click(screen.getByRole('button', { name: 'Process with options' }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/processing-options/defaults') && init?.method === 'PUT')).toBe(true)
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/processing-options/defaults') && init?.method === 'DELETE')).toBe(true)
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/documents/doc-1/process') && init?.method === 'POST')).toBe(true)
    })
  })

  it('preserves replacement and deletion actions', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) return jsonResponse(200, [documentFixture])
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'PUT') return jsonResponse(200, documentFixture)
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'DELETE') return { ok: true, status: 204, text: async () => '', json: async () => undefined }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    fireEvent.change(await screen.findByTestId('documents-replace-doc-1-input'), { target: { files: [new File(['new'], 'new.txt')] } })
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/documents/doc-1') && init?.method === 'PUT')).toBe(true)
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/documents/doc-1') && init?.method === 'DELETE')).toBe(true)
    })
  })
})
