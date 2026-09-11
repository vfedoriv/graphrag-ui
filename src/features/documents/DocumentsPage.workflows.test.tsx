import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

  it('does not process an already completed document when overwrite is declined', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [{ ...documentFixture, status: 'COMPLETED' }])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Process' }))

    expect(confirmSpy).toHaveBeenCalledWith('This document is already successfully processed. Confirm reprocess and overwrite?')
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/documents/doc-1/process'))).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Process' })).toBeEnabled()
  })

  it('retries a stale processing status after a conflict and keeps only that row pending', async () => {
    let resolveOverwrite: ((value: ReturnType<typeof jsonResponse>) => void) | undefined
    const processCalls: Array<{ url: string, init?: RequestInit }> = []
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          documentFixture,
          { ...documentFixture, id: 'doc-2', originalFilename: 'b.txt' },
        ])
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=false')) {
        processCalls.push({ url, init })
        return jsonResponse(409, { detail: 'already processed' })
      }
      if (url.endsWith('/documents/doc-1/process?allowOverwrite=true')) {
        processCalls.push({ url, init })
        return new Promise((resolve) => {
          resolveOverwrite = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click((await screen.findAllByRole('button', { name: 'Process' }))[0])

    expect(confirmSpy).toHaveBeenCalledWith('This document is already successfully processed. Confirm reprocess and overwrite?')
    const firstRow = screen.getByText('d.txt').closest('tr')
    const secondRow = screen.getByText('b.txt').closest('tr')
    expect(firstRow).not.toBeNull()
    expect(secondRow).not.toBeNull()
    expect(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Processing...' })).toBeDisabled()
    expect(within(secondRow as HTMLTableRowElement).getByRole('button', { name: 'Process' })).toBeEnabled()
    expect(processCalls.map(({ url, init }) => [url, init?.method])).toEqual([
      ['/api/v1/documents/doc-1/process?allowOverwrite=false', 'POST'],
      ['/api/v1/documents/doc-1/process?allowOverwrite=true', 'POST'],
    ])

    resolveOverwrite?.(jsonResponse(200, { ...documentFixture, status: 'COMPLETED' }))
    await waitFor(() => expect(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Process' })).toBeEnabled())
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

  it('retains the option draft after save and clear defaults failures', async () => {
    const optionsResponse = {
      documentId: 'doc-1',
      parserId: 'tika-pdf',
      fileFormat: 'PDF',
      savedDefaultsUpdatedAt: null,
      options: [{ key: 'maxPages', label: 'Max pages', valueType: 'INTEGER', defaultValue: 10, savedDefaultValue: 3, mutable: true }],
    }
    const optionCalls: Array<{ url: string, init?: RequestInit }> = []
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) return jsonResponse(200, [documentFixture])
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) return jsonResponse(200, optionsResponse)
      if (url.endsWith('/documents/doc-1/processing-options/defaults') && init?.method === 'PUT') {
        optionCalls.push({ url, init })
        return jsonResponse(500, { detail: 'Could not save defaults' })
      }
      if (url.endsWith('/documents/doc-1/processing-options/defaults') && init?.method === 'DELETE') {
        optionCalls.push({ url, init })
        return jsonResponse(500, { detail: 'Could not clear defaults' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Options' }))
    await user.clear(await screen.findByLabelText('Value for Max pages'))
    await user.type(screen.getByLabelText('Value for Max pages'), '7')

    await user.click(screen.getByRole('button', { name: 'Save defaults' }))
    expect(await screen.findByText('Could not save defaults')).toBeInTheDocument()
    expect(screen.getByDisplayValue('7')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear defaults' }))
    expect(await screen.findByText('Could not clear defaults')).toBeInTheDocument()
    expect(screen.getByDisplayValue('7')).toBeInTheDocument()
    expect(optionCalls.map(({ url, init }) => [url, init?.method, init?.body])).toEqual([
      ['/api/v1/documents/doc-1/processing-options/defaults', 'PUT', JSON.stringify({ options: { maxPages: 7 } })],
      ['/api/v1/documents/doc-1/processing-options/defaults', 'DELETE', undefined],
    ])
  })

  it('shows a failed process-with-options retry and restores its action', async () => {
    const optionsResponse = {
      documentId: 'doc-1',
      parserId: 'tika-pdf',
      fileFormat: 'PDF',
      savedDefaultsUpdatedAt: null,
      options: [{ key: 'maxPages', label: 'Max pages', valueType: 'INTEGER', defaultValue: 10, savedDefaultValue: 3, mutable: true }],
    }
    const processCalls: Array<{ url: string, init?: RequestInit }> = []
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) return jsonResponse(200, [documentFixture])
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) return jsonResponse(200, optionsResponse)
      if (url.endsWith('/documents/doc-1/process') && init?.method === 'POST') {
        processCalls.push({ url, init })
        return processCalls.length === 1
          ? jsonResponse(409, { detail: 'already processed' })
          : jsonResponse(500, { detail: 'Overwrite retry failed' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click(await screen.findByRole('button', { name: 'Options' }))
    await user.click(await screen.findByRole('button', { name: 'Process with options' }))

    expect(await screen.findByText('Overwrite retry failed')).toBeInTheDocument()
    expect(confirmSpy).toHaveBeenCalledWith('This document is already successfully processed. Confirm reprocess and overwrite?')
    expect(screen.getByRole('button', { name: 'Process with options' })).toBeEnabled()
    expect(processCalls.map(({ url, init }) => [url, init?.method, init?.body])).toEqual([
      ['/api/v1/documents/doc-1/process', 'POST', JSON.stringify({ allowOverwrite: false, options: { maxPages: 3 } })],
      ['/api/v1/documents/doc-1/process', 'POST', JSON.stringify({ allowOverwrite: true, options: { maxPages: 3 } })],
    ])
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

  it('replaces only the chosen row and clears its selected workflow after success', async () => {
    let resolveReplacement: ((value: ReturnType<typeof jsonResponse>) => void) | undefined
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [documentFixture, { ...documentFixture, id: 'doc-2', originalFilename: 'b.txt' }])
      }
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) {
        return jsonResponse(200, { documentId: 'doc-1', parserId: 'tika', fileFormat: 'TEXT', savedDefaultsUpdatedAt: null, options: [] })
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'PUT') {
        return new Promise((resolve) => {
          resolveReplacement = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click((await screen.findAllByRole('button', { name: 'Options' }))[0])
    await screen.findByTestId('document-processing-options-workflow')
    const replacement = new File(['replacement'], 'replacement.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByTestId('documents-replace-doc-1-input'), { target: { files: [replacement] } })

    const firstRow = screen.getByText('d.txt').closest('tr')
    const secondRow = screen.getByText('b.txt').closest('tr')
    expect(firstRow).not.toBeNull()
    expect(secondRow).not.toBeNull()
    expect(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Replacing...' })).toBeDisabled()
    expect(within(secondRow as HTMLTableRowElement).getByRole('button', { name: 'Replace' })).toBeEnabled()
    expect(confirmSpy).toHaveBeenCalledWith('Replace this document? Existing processed chunks and extracted artifacts will be cleared.')
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/documents/doc-1') && init?.method === 'PUT')).toBe(true)
    })
    const replacementCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/documents/doc-1') && init?.method === 'PUT')
    expect(replacementCall).toBeDefined()
    expect((replacementCall?.[1]?.body as FormData).get('file')).toBe(replacement)

    resolveReplacement?.(jsonResponse(200, documentFixture))
    await waitFor(() => expect(screen.queryByTestId('document-processing-options-workflow')).not.toBeInTheDocument())
    expect(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Replace' })).toBeEnabled()
  })

  it('cleans up a failed deletion while retaining the selected document workflow', async () => {
    let rejectDeletion: ((reason?: unknown) => void) | undefined
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [documentFixture, { ...documentFixture, id: 'doc-2', originalFilename: 'b.txt' }])
      }
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) {
        return jsonResponse(200, { documentId: 'doc-1', parserId: 'tika', fileFormat: 'TEXT', savedDefaultsUpdatedAt: null, options: [] })
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'DELETE') {
        return new Promise((_, reject) => {
          rejectDeletion = reject
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })
    await user.click((await screen.findAllByRole('button', { name: 'Options' }))[0])
    await screen.findByTestId('document-processing-options-workflow')
    const firstRow = screen.getByText('d.txt').closest('tr')
    const secondRow = screen.getByText('b.txt').closest('tr')
    expect(firstRow).not.toBeNull()
    expect(secondRow).not.toBeNull()

    await user.click(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }))
    expect(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Deleting...' })).toBeDisabled()
    expect(within(secondRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' })).toBeEnabled()
    expect(confirmSpy).toHaveBeenCalledWith('Delete this document and its document-scoped artifacts?')
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/documents/doc-1') && init?.method === 'DELETE')).toBe(true)

    rejectDeletion?.(new Error('Delete request failed'))
    expect(await screen.findByText('Delete request failed')).toBeInTheDocument()
    expect(screen.getByTestId('document-processing-options-workflow')).toBeInTheDocument()
    expect(within(firstRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' })).toBeEnabled()
  })
})
