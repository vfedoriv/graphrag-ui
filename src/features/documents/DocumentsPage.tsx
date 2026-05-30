import { useState } from 'react'
import { useDocumentChunksQuery, useDocumentsQuery, useProcessDocumentMutation, useUploadDocumentMutation } from '../../api/documents'
import { ApiError, type DocumentChunk } from '../../api/types'
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

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const processMutation = useProcessDocumentMutation()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedUploadFilename, setSelectedUploadFilename] = useState<string>('')
  const [processingDocumentIds, setProcessingDocumentIds] = useState<Set<string>>(new Set())
  const [chunkViewMode, setChunkViewMode] = useState<ChunkViewMode>('readable')
  const chunksQuery = useDocumentChunksQuery(selectedDocumentId)
  const hasBackendProcessingDocument = documents.some((doc) => isDocumentProcessingStatus(doc.status))
  const isAnyPending = uploadMutation.isPending || processMutation.isPending || chunksQuery.isLoading || hasBackendProcessingDocument

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
      headers={['Filename', 'Status', 'Error', 'Actions']}
      rows={documents.map((doc) => [
        doc.originalFilename,
        doc.status,
        doc.errorMessage ?? '-',
        <div className='flex gap-2'>
          <Button
            type='button'
            isPending={processingDocumentIds.has(doc.id) || isDocumentProcessingStatus(doc.status)}
            pendingText='Processing...'
            onClick={() => {
              void handleProcessDocument(doc.id, doc.status)
            }}
            className='bg-slate-700'
          >
            Process
          </Button>
          <Button
            type='button'
            isPending={chunksQuery.isLoading && selectedDocumentId === doc.id}
            pendingText='Loading...'
            onClick={() => {
              setSelectedDocumentId(doc.id)
              setChunkViewMode('readable')
            }}
          >
            View chunks
          </Button>
        </div>,
      ])}
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
