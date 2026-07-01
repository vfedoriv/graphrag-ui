import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentsPage } from './DocumentsPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('documents workflows', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
      if (url.endsWith('/documents/doc-1/chunks')) return jsonResponse(200, [{ id: 'chunk-1', documentId: 'doc-1', chunkIndex: 0, text: 'hello', tokenEstimate: 1, metadata: '{"source":"source-doc.txt"}' }])
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
    expect(await screen.findByTestId('document-chunks-readable-view')).toHaveClass('stack')
    expect(screen.getByRole('button', { name: 'Readable view' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Chunk 0')).toBeInTheDocument()
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('source-doc.txt')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()

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

  it('shows processing state for backend in-progress document status', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'processing.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'EXTRACTING_GRAPH',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
          {
            id: 'doc-2',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'uploaded.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'y',
            contentUri: 'uri2',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('processing.txt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Process' })).toBeEnabled()
    expect(screen.getByText('Waiting for document workflow response...')).toBeInTheDocument()
  })

  it('opens processing options, renders dynamic controls, saves defaults, and clears defaults', async () => {
    let optionsPayload = {
      documentId: 'doc-1',
      parserId: 'tika-pdf',
      fileFormat: 'PDF',
      savedDefaultsUpdatedAt: '2026-06-01T00:00:00Z',
      options: [
        {
          key: 'preserveLineBreaks',
          label: 'Preserve line breaks',
          description: 'Keep source line breaks.',
          valueType: 'BOOLEAN',
          defaultValue: false,
          savedDefaultValue: true,
          mutable: true,
        },
        {
          key: 'maxPages',
          label: 'Max pages',
          valueType: 'INTEGER',
          defaultValue: 10,
          savedDefaultValue: 3,
          mutable: true,
          constraints: { min: 1, max: 20 },
        },
        {
          key: 'quality',
          label: 'Quality',
          valueType: 'STRING',
          defaultValue: 'fast',
          savedDefaultValue: 'fast',
          mutable: true,
          constraints: { allowedValues: ['fast', 'high'] },
        },
        {
          key: 'ocr.language',
          label: 'OCR language',
          valueType: 'STRING',
          defaultValue: 'eng',
          savedDefaultValue: null,
          mutable: true,
        },
        {
          key: 'parser.version',
          label: 'Parser version',
          valueType: 'STRING',
          defaultValue: 'builtin',
          savedDefaultValue: null,
          mutable: false,
        },
      ],
    }

    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'paper.pdf',
            contentType: 'application/pdf',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) {
        return jsonResponse(200, optionsPayload)
      }
      if (url.endsWith('/documents/doc-1/processing-options/defaults') && init?.method === 'PUT') {
        optionsPayload = {
          ...optionsPayload,
          options: optionsPayload.options.map((option) => ({
            ...option,
            savedDefaultValue: option.key === 'maxPages' ? 7 : option.key === 'quality' ? 'high' : option.key === 'ocr.language' ? 'ukr' : option.savedDefaultValue,
          })),
        }
        return jsonResponse(200, optionsPayload)
      }
      if (url.endsWith('/documents/doc-1/processing-options/defaults') && init?.method === 'DELETE') {
        optionsPayload = {
          ...optionsPayload,
          savedDefaultsUpdatedAt: null,
          options: optionsPayload.options.map((option) => ({ ...option, savedDefaultValue: null })),
        }
        return jsonResponse(200, optionsPayload)
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Options' }))

    expect(await screen.findByTestId('document-processing-options-workflow')).toBeInTheDocument()
    expect(screen.getByText('Parser: tika-pdf')).toBeInTheDocument()
    expect(screen.getByText('Format: PDF')).toBeInTheDocument()
    expect(screen.getByLabelText('Value for Preserve line breaks')).toBeChecked()
    expect(screen.getByLabelText('Value for Max pages')).toHaveValue(3)
    expect(screen.getByLabelText('Value for Quality')).toHaveValue('fast')
    expect(screen.getByLabelText('Value for OCR language')).toHaveValue('eng')
    expect(screen.getByText('Parser version')).toBeInTheDocument()
    expect(screen.getByText('Read-only')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Value for Preserve line breaks'))
    await user.clear(screen.getByLabelText('Value for Max pages'))
    await user.type(screen.getByLabelText('Value for Max pages'), '7')
    await user.selectOptions(screen.getByLabelText('Value for Quality'), 'high')
    await user.clear(screen.getByLabelText('Value for OCR language'))
    await user.type(screen.getByLabelText('Value for OCR language'), 'ukr')
    await user.click(screen.getByRole('button', { name: 'Save defaults' }))

    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        (call) =>
          String(call[0]).endsWith('/api/v1/documents/doc-1/processing-options/defaults') &&
          ((call[1] as RequestInit | undefined)?.method === 'PUT'),
      )
      expect((saveCall?.[1] as RequestInit).body).toBe(
        JSON.stringify({ options: { preserveLineBreaks: false, maxPages: 7, quality: 'high', 'ocr.language': 'ukr' } }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Clear defaults' }))
    await waitFor(() => {
      expect(screen.getByLabelText('Value for Max pages')).toHaveValue(10)
      expect(screen.getByLabelText('Value for Quality')).toHaveValue('fast')
      expect(screen.getByLabelText('Value for OCR language')).toHaveValue('eng')
      expect(
        fetchMock.mock.calls.some(
          (call) =>
            String(call[0]).endsWith('/api/v1/documents/doc-1/processing-options/defaults') &&
            ((call[1] as RequestInit | undefined)?.method === 'DELETE'),
        ),
      ).toBe(true)
    })
  })

  it('shows unsupported document processing-options errors while keeping rows actionable', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'image.bin',
            contentType: 'application/octet-stream',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) {
        return jsonResponse(415, { detail: 'No parser options are available for this file type' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Options' }))

    expect(await screen.findByText('Load processing options failed')).toBeInTheDocument()
    expect(screen.getByText('No parser options are available for this file type')).toBeInTheDocument()
    expect(screen.getByText('image.bin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Process' })).toBeEnabled()
  })

  it('processes with options using overwrite confirmation and preserves drafts after validation errors', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'paper.pdf',
            contentType: 'application/pdf',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'COMPLETED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) {
        return jsonResponse(200, {
          documentId: 'doc-1',
          parserId: 'tika-pdf',
          fileFormat: 'PDF',
          options: [
            {
              key: 'maxPages',
              label: 'Max pages',
              valueType: 'INTEGER',
              defaultValue: 10,
              savedDefaultValue: 3,
              mutable: true,
            },
          ],
        })
      }
      if (url.endsWith('/documents/doc-1/process') && init?.method === 'POST') {
        return jsonResponse(400, { detail: 'maxPages must be less than or equal to 20' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Options' }))
    await user.clear(await screen.findByLabelText('Value for Max pages'))
    await user.type(screen.getByLabelText('Value for Max pages'), '99')

    await user.click(screen.getByRole('button', { name: 'Process with options' }))
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith('/api/v1/documents/doc-1/process'))).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Process with options' }))
    expect(await screen.findByText('Process with options failed')).toBeInTheDocument()
    expect(screen.getByText('maxPages must be less than or equal to 20')).toBeInTheDocument()
    expect(screen.getByLabelText('Value for Max pages')).toHaveValue(99)

    const processCall = fetchMock.mock.calls.find(
      (call) => String(call[0]).endsWith('/api/v1/documents/doc-1/process') && ((call[1] as RequestInit | undefined)?.method === 'POST'),
    )
    expect(String(processCall?.[0])).not.toContain('allowOverwrite')
    expect((processCall?.[1] as RequestInit).body).toBe(JSON.stringify({ allowOverwrite: true, options: { maxPages: 99 } }))
  })

  it('shows option-aware process pending state without changing other row process buttons', async () => {
    let resolveProcess: ((value: Response) => void) | null = null
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'a.pdf',
            contentType: 'application/pdf',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
          {
            id: 'doc-2',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'b.pdf',
            contentType: 'application/pdf',
            sizeBytes: 10,
            sha256: 'y',
            contentUri: 'uri',
            status: 'UPLOADED',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/processing-options') && !init?.method) {
        return jsonResponse(200, {
          documentId: 'doc-1',
          parserId: 'tika-pdf',
          fileFormat: 'PDF',
          options: [{ key: 'maxPages', label: 'Max pages', valueType: 'INTEGER', defaultValue: 10, mutable: true }],
        })
      }
      if (url.endsWith('/documents/doc-1/process') && init?.method === 'POST') {
        return new Promise<Response>((resolve) => {
          resolveProcess = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const optionButtons = await screen.findAllByRole('button', { name: 'Options' })
    await user.click(optionButtons[0])
    await user.click(await screen.findByRole('button', { name: 'Process with options' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
      expect(screen.getAllByRole('button', { name: 'Process' })).toHaveLength(2)
    })

    resolveProcess?.(jsonResponse(200, { id: 'doc-1', knowledgeBaseId: 'kb-a' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Process with options' })).toBeEnabled()
    })
  })

  it('restores processing state from backend status after Documents page remounts', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'processing.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'EXTRACTING_GRAPH',
            uploadedAt: '',
            processedAt: null,
            errorMessage: null,
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const { rerender } = renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByRole('button', { name: 'Processing...' })).toBeDisabled()

    rerender(<section>Other page</section>)
    expect(screen.queryByText('processing.txt')).not.toBeInTheDocument()

    rerender(<DocumentsPage />)
    expect(await screen.findByText('processing.txt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled()
  })

  it('confirms replacement and clears selected chunk output', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'd.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'PROCESSED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/chunks')) {
        return jsonResponse(200, [
          { id: 'chunk-1', documentId: 'doc-1', chunkIndex: 0, text: 'stale chunk', tokenEstimate: 1, metadata: '{}' },
        ])
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'PUT') {
        return jsonResponse(200, {
          id: 'doc-1',
          knowledgeBaseId: 'kb-a',
          originalFilename: 'replacement.txt',
          contentType: 'text/plain',
          sizeBytes: 12,
          sha256: 'y',
          contentUri: 'uri2',
          status: 'UPLOADED',
          uploadedAt: '',
          processedAt: null,
          errorMessage: null,
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'View chunks' }))
    expect(await screen.findByText('stale chunk')).toBeInTheDocument()

    const input = (await screen.findByTestId('documents-replace-doc-1-input')) as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['new'], 'replacement.txt', { type: 'text/plain' })] } })

    await waitFor(() => {
      expect(screen.getByText('Choose a document in the table above and click View chunks or Options.')).toBeInTheDocument()
    })

    const replaceCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith('/api/v1/knowledge-bases/kb-a/documents/doc-1') &&
        ((call[1] as RequestInit | undefined)?.method === 'PUT'),
    )
    expect(replaceCall).toBeTruthy()
    expect((replaceCall?.[1] as RequestInit).body instanceof FormData).toBe(true)
  })

  it('does not replace when confirmation is declined', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
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
          },
        ])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const input = (await screen.findByTestId('documents-replace-doc-1-input')) as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['new'], 'replacement.txt', { type: 'text/plain' })] } })

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => String(call[0]))
      expect(urls.some((url) => url.endsWith('/api/v1/knowledge-bases/kb-a/documents/doc-1'))).toBe(false)
    })
  })

  it('shows replacement failure feedback while keeping the list visible', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
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
          },
        ])
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'PUT') {
        return jsonResponse(409, { detail: 'Replacement duplicates another document' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    const input = (await screen.findByTestId('documents-replace-doc-1-input')) as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['new'], 'replacement.txt', { type: 'text/plain' })] } })

    expect(await screen.findByText('Replace failed')).toBeInTheDocument()
    expect(screen.getByText('Replacement duplicates another document')).toBeInTheDocument()
    expect(screen.getByText('d.txt')).toBeInTheDocument()
  })

  it('confirms deletion and clears selected chunk output', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'doc-1',
            knowledgeBaseId: 'kb-a',
            originalFilename: 'd.txt',
            contentType: 'text/plain',
            sizeBytes: 10,
            sha256: 'x',
            contentUri: 'uri',
            status: 'PROCESSED',
            uploadedAt: '',
            processedAt: '',
            errorMessage: null,
          },
        ])
      }
      if (url.endsWith('/documents/doc-1/chunks')) {
        return jsonResponse(200, [
          { id: 'chunk-1', documentId: 'doc-1', chunkIndex: 0, text: 'delete chunk', tokenEstimate: 1, metadata: '{}' },
        ])
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'DELETE') {
        return {
          ok: true,
          status: 204,
          text: async () => '',
          json: async () => undefined,
        }
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'View chunks' }))
    expect(await screen.findByText('delete chunk')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByText('Choose a document in the table above and click View chunks or Options.')).toBeInTheDocument()
    })

    expect(
      fetchMock.mock.calls.some(
        (call) =>
          String(call[0]).endsWith('/api/v1/knowledge-bases/kb-a/documents/doc-1') &&
          ((call[1] as RequestInit | undefined)?.method === 'DELETE'),
      ),
    ).toBe(true)
  })

  it('shows deletion failure feedback while keeping the list visible', async () => {
    const user = userEvent.setup()
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents') && !init?.method) {
        return jsonResponse(200, [
          {
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
          },
        ])
      }
      if (url.endsWith('/knowledge-bases/kb-a/documents/doc-1') && init?.method === 'DELETE') {
        return jsonResponse(500, { detail: 'Stored binary deletion failed' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderWithProviders(<DocumentsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Delete failed')).toBeInTheDocument()
    expect(screen.getByText('Stored binary deletion failed')).toBeInTheDocument()
    expect(screen.getByText('d.txt')).toBeInTheDocument()
  })
})
