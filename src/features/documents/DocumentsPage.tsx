import { useEffect, useState } from 'react'
import {
  useDeleteDocumentMutation,
  useDocumentChunksQuery,
  useDocumentsQuery,
  useProcessDocumentMutation,
  useReplaceDocumentMutation,
  useUploadDocumentMutation,
} from '../../api/documents'
import { ApiError, type DocumentChunk, type DocumentUpload } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { Table } from '../../shared/ui/Table'
import { isCompletedOrSuccessfullyProcessed, isDocumentProcessingStatus } from './documentStatus'

type ChunkViewMode = 'readable' | 'json'
const documentOpenedMessage = 'Document opened in another window'

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const processMutation = useProcessDocumentMutation()
  const replaceMutation = useReplaceDocumentMutation()
  const deleteMutation = useDeleteDocumentMutation()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedUploadFilename, setSelectedUploadFilename] = useState<string>('')
  const [processingDocumentIds, setProcessingDocumentIds] = useState<Set<string>>(new Set())
  const [replacingDocumentIds, setReplacingDocumentIds] = useState<Set<string>>(new Set())
  const [deletingDocumentIds, setDeletingDocumentIds] = useState<Set<string>>(new Set())
  const [copiedPathDocumentId, setCopiedPathDocumentId] = useState<string | null>(null)
  const [openingDocumentIds, setOpeningDocumentIds] = useState<Set<string>>(new Set())
  const [openErrorMessage, setOpenErrorMessage] = useState<string | null>(null)
  const [openSuccessMessage, setOpenSuccessMessage] = useState<string | null>(null)
  const [chunkViewMode, setChunkViewMode] = useState<ChunkViewMode>('readable')
  const chunksQuery = useDocumentChunksQuery(selectedDocumentId)
  const hasBackendProcessingDocument = documents.some((doc) => isDocumentProcessingStatus(doc.status))
  const isAnyPending =
    uploadMutation.isPending ||
    processMutation.isPending ||
    replaceMutation.isPending ||
    deleteMutation.isPending ||
    chunksQuery.isLoading ||
    hasBackendProcessingDocument

  useEffect(() => {
    if (!openSuccessMessage) return undefined
    const timeoutId = window.setTimeout(() => {
      setOpenSuccessMessage(null)
    }, 10000)
    return () => window.clearTimeout(timeoutId)
  }, [openSuccessMessage])

  const handleProcessDocument = async (documentId: string, status: string) => {
    const runProcess = async (allowOverwrite: boolean) => {
      setProcessingDocumentIds((prev) => {
        const next = new Set(prev)
        next.add(documentId)
        return next
      })
      try {
        await processMutation.mutateAsync({ documentId, allowOverwrite })
      } finally {
        setProcessingDocumentIds((prev) => {
          const next = new Set(prev)
          next.delete(documentId)
          return next
        })
      }
    }

    const shouldOverwrite = isCompletedOrSuccessfullyProcessed(status)
      ? window.confirm('This document is already successfully processed. Confirm reprocess and overwrite?')
      : false
    if (isCompletedOrSuccessfullyProcessed(status) && !shouldOverwrite) {
      return
    }
    try {
      await runProcess(shouldOverwrite)
    } catch (error) {
      // Fallback for stale UI status: backend truth is authoritative.
      if (!shouldOverwrite && error instanceof ApiError && error.status === 409) {
        const confirmed = window.confirm('This document is already successfully processed. Confirm reprocess and overwrite?')
        if (!confirmed) return
        await runProcess(true)
      }
    }
  }

  const clearSelectedDocumentIfNeeded = (documentId: string) => {
    if (selectedDocumentId === documentId) {
      setSelectedDocumentId(null)
      setChunkViewMode('readable')
    }
  }

  const handleReplaceDocument = async (documentId: string, file: File) => {
    if (!selectedKnowledgeBaseId) return
    const confirmed = window.confirm('Replace this document? Existing processed chunks and extracted artifacts will be cleared.')
    if (!confirmed) return
    setReplacingDocumentIds((prev) => {
      const next = new Set(prev)
      next.add(documentId)
      return next
    })
    try {
      await replaceMutation.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, documentId, file })
      clearSelectedDocumentIfNeeded(documentId)
    } catch {
      // Mutation error state renders the user-facing alert.
    } finally {
      setReplacingDocumentIds((prev) => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedKnowledgeBaseId) return
    const confirmed = window.confirm('Delete this document and its document-scoped artifacts?')
    if (!confirmed) return
    setDeletingDocumentIds((prev) => {
      const next = new Set(prev)
      next.add(documentId)
      return next
    })
    try {
      await deleteMutation.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, documentId })
      clearSelectedDocumentIfNeeded(documentId)
    } catch {
      // Mutation error state renders the user-facing alert.
    } finally {
      setDeletingDocumentIds((prev) => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
    }
  }

  const handleOpenDocument = async (doc: DocumentUpload) => {
    setOpenErrorMessage(null)
    setOpenSuccessMessage(null)
    if (doc.localPath) {
      setOpeningDocumentIds((prev) => {
        const next = new Set(prev)
        next.add(doc.id)
        return next
      })
      try {
        await requestLocalFileOpen(doc.localPath)
        setOpenSuccessMessage(documentOpenedMessage)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to open local file.'
        setOpenErrorMessage(message)
      } finally {
        setOpeningDocumentIds((prev) => {
          const next = new Set(prev)
          next.delete(doc.id)
          return next
        })
      }
      return
    }

    const target = getDocumentOpenTarget(doc)
    if (!target) {
      setOpenErrorMessage('No local path or openable document URI is available.')
      return
    }
    const opened = window.open(target, '_blank', 'noopener,noreferrer')
    if (!opened) {
      setOpenErrorMessage('The browser blocked opening this document. Copy the source path and open it locally.')
    }
  }

  const handleCopyPath = async (doc: DocumentUpload) => {
    if (!doc.localPath) return
    await navigator.clipboard.writeText(doc.localPath)
    setCopiedPathDocumentId(doc.id)
  }

  const processErrorMessage = (() => {
    const error = processMutation.error
    if (error instanceof ApiError && error.status === 409) {
      return 'Document is already processed. Confirm overwrite to reprocess this file.'
    }
    return error instanceof Error ? error.message : null
  })()

  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base before uploading documents.' tone='info' />
  }

  const topSection = documents.length === 0 ? (
    <EmptyState title='No Documents' body='Upload a document and process it to inspect chunks.' />
  ) : (
    <Table
      headers={['Filename', 'Status', 'Source path', 'Error', 'Actions']}
      rows={documents.map((doc) => [
        doc.originalFilename,
        doc.status,
        <DocumentSourceContext
          doc={doc}
          wasCopied={copiedPathDocumentId === doc.id}
          isOpening={openingDocumentIds.has(doc.id)}
          onOpen={() => handleOpenDocument(doc)}
          onCopy={() => {
            void handleCopyPath(doc)
          }}
        />,
        doc.errorMessage ?? '-',
        <DocumentRowActions
          isProcessing={processingDocumentIds.has(doc.id) || isDocumentProcessingStatus(doc.status)}
          isLoadingChunks={chunksQuery.isLoading && selectedDocumentId === doc.id}
          isReplacing={replacingDocumentIds.has(doc.id)}
          isDeleting={deletingDocumentIds.has(doc.id)}
          onProcess={() => {
            void handleProcessDocument(doc.id, doc.status)
          }}
          onReplace={(file) => {
            void handleReplaceDocument(doc.id, file)
          }}
          onViewChunks={() => {
            setSelectedDocumentId(doc.id)
            setChunkViewMode('readable')
          }}
          onDelete={() => {
            void handleDeleteDocument(doc.id)
          }}
          replaceTestId={`documents-replace-${doc.id}`}
        />,
      ])}
      rowKeys={documents.map((doc) => doc.id)}
    />
  )

  return (
    <ControllerPage
      title='Documents'
      topSectionTitle='Documents list'
      topSection={
        <div className='space-y-4'>
          {isAnyPending ? <ProgressBanner message='Waiting for document workflow response...' /> : null}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-700'>Upload document</h3>
            <FileSelectButton
              buttonLabel='Select file to upload'
              testId='documents-upload-select-file'
              onFileSelected={(file) => {
                setSelectedUploadFilename(file.name)
                uploadMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, file })
              }}
            />
            {selectedUploadFilename ? <p className='text-sm text-slate-600'>Selected file: {selectedUploadFilename}</p> : null}
            {uploadMutation.error ? <Alert title='Upload failed' message={(uploadMutation.error as Error).message} /> : null}
            {processErrorMessage ? <Alert title='Process failed' message={processErrorMessage} /> : null}
            {openSuccessMessage ? <Alert title='Open requested' message={openSuccessMessage} tone='success' /> : null}
            {openErrorMessage ? <Alert title='Open failed' message={openErrorMessage} /> : null}
            {replaceMutation.error ? <Alert title='Replace failed' message={(replaceMutation.error as Error).message} /> : null}
            {deleteMutation.error ? <Alert title='Delete failed' message={(deleteMutation.error as Error).message} /> : null}
          </section>
          {topSection}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-700'>Inspect document chunks</h3>
            {selectedDocumentId ? (
              <>
                <p className='text-sm text-slate-600'>Selected document: {selectedDocumentId}</p>
                {chunksQuery.isLoading ? (
                  <p className='text-sm text-slate-600'>Loading chunks...</p>
                ) : chunksQuery.error ? (
                  <Alert title='Load chunks failed' message={(chunksQuery.error as Error).message} />
                ) : (
                  <DocumentChunksInspector chunks={chunksQuery.data ?? []} mode={chunkViewMode} onModeChange={setChunkViewMode} />
                )}
              </>
            ) : (
              <p className='text-sm text-slate-700'>Choose a document in the table above and click View chunks.</p>
            )}
          </section>
        </div>
      }
      testId='documents-controller-page'
    />
  )
}

function DocumentRowActions({
  isProcessing,
  isLoadingChunks,
  isReplacing,
  isDeleting,
  onProcess,
  onReplace,
  onViewChunks,
  onDelete,
  replaceTestId,
}: {
  isProcessing: boolean
  isLoadingChunks: boolean
  isReplacing: boolean
  isDeleting: boolean
  onProcess: () => void
  onReplace: (file: File) => void
  onViewChunks: () => void
  onDelete: () => void
  replaceTestId: string
}) {
  return (
    <div className='grid w-[28rem] grid-cols-[7rem_7rem_9rem] gap-2'>
      <Button
        type='button'
        isPending={isProcessing}
        pendingText='Processing...'
        onClick={onProcess}
        className='w-full bg-slate-700'
      >
        Process
      </Button>
      <FileSelectButton
        buttonLabel='Replace'
        testId={replaceTestId}
        className='w-full bg-amber-700'
        isPending={isReplacing}
        pendingText='Replacing...'
        disabled={isDeleting}
        onFileSelected={onReplace}
      />
      <Button
        type='button'
        isPending={isLoadingChunks}
        pendingText='Loading...'
        onClick={onViewChunks}
        className='w-full'
      >
        View chunks
      </Button>
      <Button
        type='button'
        className='col-start-1 w-full bg-red-700'
        isPending={isDeleting}
        pendingText='Deleting...'
        disabled={isReplacing}
        onClick={onDelete}
      >
        Delete
      </Button>
    </div>
  )
}

function DocumentSourceContext({
  doc,
  wasCopied,
  isOpening,
  onOpen,
  onCopy,
}: {
  doc: DocumentUpload
  wasCopied: boolean
  isOpening: boolean
  onOpen: () => void
  onCopy: () => void
}) {
  const openTarget = getDocumentOpenTarget(doc)
  const hasActions = Boolean(openTarget || doc.localPath)

  return (
    <div className='w-56'>
      {hasActions ? (
        <div className='grid grid-cols-2 gap-2'>
          <Button
            type='button'
            className='w-full bg-emerald-700 px-2 py-1.5 text-xs'
            isPending={isOpening}
            pendingText='Opening...'
            disabled={!openTarget}
            onClick={() => {
              void onOpen()
            }}
          >
            Open
          </Button>
          <Button
            type='button'
            className='w-full bg-slate-600 px-2 py-1.5 text-xs'
            disabled={!doc.localPath}
            onClick={onCopy}
          >
            {wasCopied ? 'Copied' : 'Copy path'}
          </Button>
        </div>
      ) : (
        <span className='text-sm text-slate-500'>-</span>
      )}
    </div>
  )
}

function getDocumentOpenTarget(doc: DocumentUpload) {
  if (doc.localPath) return doc.localPath
  if (isUsableDocumentUri(doc.contentUri)) return doc.contentUri
  return null
}

async function requestLocalFileOpen(localPath: string) {
  const response = await fetch('/__graphrag-ui/open-local-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: localPath }),
  })

  if (!response.ok) {
    throw new Error(await getOpenFailureMessage(response))
  }
}

async function getOpenFailureMessage(response: Response) {
  try {
    const payload = (await response.json()) as unknown
    if (isRecord(payload) && typeof payload.detail === 'string') {
      return payload.detail
    }
  } catch {
    // Fall through to status-based feedback.
  }
  if (response.status === 404) {
    return 'Local file opening is not available from this server. Copy the source path and open it locally.'
  }
  return 'Unable to open local file. Copy the source path and open it locally.'
}

function isUsableDocumentUri(value: string | null | undefined) {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return ['file:', 'http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function DocumentChunksInspector({
  chunks,
  mode,
  onModeChange,
}: {
  chunks: DocumentChunk[]
  mode: ChunkViewMode
  onModeChange: (mode: ChunkViewMode) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm font-medium text-slate-700'>Document chunks</p>
        <div className='flex rounded-md border border-slate-300 bg-white p-1' aria-label='Document chunk view mode'>
          <ChunkModeButton isActive={mode === 'readable'} onClick={() => onModeChange('readable')}>
            Readable view
          </ChunkModeButton>
          <ChunkModeButton isActive={mode === 'json'} onClick={() => onModeChange('json')}>
            Raw JSON
          </ChunkModeButton>
        </div>
      </div>

      {mode === 'json' ? (
        <OutputPreview label='Document chunks JSON' format='json'>{JSON.stringify(chunks, null, 2)}</OutputPreview>
      ) : (
        <div
          data-testid='document-chunks-readable-view'
          className='max-h-96 space-y-3 overflow-y-auto rounded-md border border-slate-300 bg-slate-50 p-3'
        >
          {chunks.length === 0 ? (
            <p className='text-sm text-slate-600'>No chunks returned for this document.</p>
          ) : (
            chunks.map((chunk) => <DocumentChunkCard key={chunk.id} chunk={chunk} />)
          )}
        </div>
      )}
    </div>
  )
}

function ChunkModeButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type='button'
      aria-pressed={isActive}
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
        isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function DocumentChunkCard({ chunk }: { chunk: DocumentChunk }) {
  const source = getChunkSource(chunk.metadata)

  return (
    <article className='space-y-3 rounded-md border border-slate-300 bg-white p-4 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h4 className='text-base font-semibold text-slate-900'>Chunk {chunk.chunkIndex}</h4>
          <p className='break-all text-xs text-slate-500'>ID: {chunk.id}</p>
        </div>
        <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700'>
          {chunk.tokenEstimate} tokens
        </div>
      </div>

      {source ? (
        <dl className='grid gap-1 text-sm sm:grid-cols-[auto_1fr]'>
          <dt className='font-semibold text-slate-700'>Source</dt>
          <dd className='break-words text-slate-600'>{source}</dd>
        </dl>
      ) : null}

      <div className='space-y-1'>
        <p className='text-sm font-semibold text-slate-700'>Text</p>
        <div className='max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100'>
          {chunk.text}
        </div>
      </div>
    </article>
  )
}

function getChunkSource(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as unknown
    if (isRecord(parsed) && typeof parsed.source === 'string') {
      return parsed.source
    }
  } catch {
    return null
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
