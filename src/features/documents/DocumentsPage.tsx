import { useState } from 'react'
import { useDocumentChunksQuery, useDocumentsQuery, useProcessDocumentMutation, useUploadDocumentMutation } from '../../api/documents'
import { ApiError } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { Table } from '../../shared/ui/Table'

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const processMutation = useProcessDocumentMutation()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedUploadFilename, setSelectedUploadFilename] = useState<string>('')
  const [processingDocumentIds, setProcessingDocumentIds] = useState<Set<string>>(new Set())
  const chunksQuery = useDocumentChunksQuery(selectedDocumentId)
  const isAnyPending = uploadMutation.isPending || processMutation.isPending || chunksQuery.isLoading

  const isCompletedOrSuccessfullyProcessed = (status: string) => {
    const normalized = status.trim().toUpperCase()
    return normalized.includes('PROCESSED') || normalized.includes('COMPLETED') || normalized.includes('SUCCESS')
  }

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
            isPending={processingDocumentIds.has(doc.id)}
            pendingText='Processing...'
            onClick={() => {
              void handleProcessDocument(doc.id, doc.status)
            }}
            className='bg-slate-700'
          >
            Process
          </Button>
          <Button type='button' isPending={chunksQuery.isLoading && selectedDocumentId === doc.id} pendingText='Loading...' onClick={() => setSelectedDocumentId(doc.id)}>View chunks</Button>
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
                  <OutputPreview label='Document chunks JSON'>{JSON.stringify(chunksQuery.data, null, 2)}</OutputPreview>
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
