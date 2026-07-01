import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  useClearDocumentProcessingDefaultsMutation,
  useDeleteDocumentMutation,
  useDocumentChunksQuery,
  useDocumentProcessingOptionsQuery,
  useDocumentsQuery,
  useProcessDocumentMutation,
  useProcessDocumentWithOptionsMutation,
  useReplaceDocumentMutation,
  useSaveDocumentProcessingDefaultsMutation,
  useUploadDocumentMutation,
} from '../../api/documents'
import { ApiError, type DocumentChunk, type DocumentProcessingOptionDefinition, type DocumentProcessingOptionsResponse, type DocumentUpload } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import { isCompletedOrSuccessfullyProcessed, isDocumentProcessingStatus } from './documentStatus'
import {
  buildProcessingOptionDraft,
  formatProcessingOptionValue,
  getAllowedValues,
  getNumericConstraint,
  serializeMutableProcessingOptions,
  type ProcessingOptionDraft,
  type ProcessingOptionDraftValue,
} from './processingOptions'

type ChunkViewMode = 'readable' | 'json'
type SelectedDocumentPurpose = 'chunks' | 'processing-options'
type SelectedDocumentWorkflow = {
  documentId: string
  purpose: SelectedDocumentPurpose
}
const documentOpenedMessage = 'Document opened in another window'

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const processMutation = useProcessDocumentMutation()
  const processWithOptionsMutation = useProcessDocumentWithOptionsMutation()
  const saveProcessingDefaultsMutation = useSaveDocumentProcessingDefaultsMutation()
  const clearProcessingDefaultsMutation = useClearDocumentProcessingDefaultsMutation()
  const replaceMutation = useReplaceDocumentMutation()
  const deleteMutation = useDeleteDocumentMutation()
  const [selectedWorkflow, setSelectedWorkflow] = useState<SelectedDocumentWorkflow | null>(null)
  const [selectedUploadFilename, setSelectedUploadFilename] = useState<string>('')
  const [processingDocumentIds, setProcessingDocumentIds] = useState<Set<string>>(new Set())
  const [optionProcessingDocumentIds, setOptionProcessingDocumentIds] = useState<Set<string>>(new Set())
  const [replacingDocumentIds, setReplacingDocumentIds] = useState<Set<string>>(new Set())
  const [deletingDocumentIds, setDeletingDocumentIds] = useState<Set<string>>(new Set())
  const [copiedPathDocumentId, setCopiedPathDocumentId] = useState<string | null>(null)
  const [openingDocumentIds, setOpeningDocumentIds] = useState<Set<string>>(new Set())
  const [openErrorMessage, setOpenErrorMessage] = useState<string | null>(null)
  const [openSuccessMessage, setOpenSuccessMessage] = useState<string | null>(null)
  const [chunkViewMode, setChunkViewMode] = useState<ChunkViewMode>('readable')
  const [optionDraftOverride, setOptionDraftOverride] = useState<ProcessingOptionDraft | null>(null)
  const selectedDocumentId = selectedWorkflow?.documentId ?? null
  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  )
  const chunksQuery = useDocumentChunksQuery(selectedWorkflow?.purpose === 'chunks' ? selectedWorkflow.documentId : null)
  const processingOptionsQuery = useDocumentProcessingOptionsQuery(
    selectedWorkflow?.purpose === 'processing-options' ? selectedWorkflow.documentId : null,
  )
  const loadedOptionDraft = useMemo(
    () => (processingOptionsQuery.data ? buildProcessingOptionDraft(processingOptionsQuery.data.options) : {}),
    [processingOptionsQuery.data],
  )
  const optionDraft = optionDraftOverride ?? loadedOptionDraft
  const hasBackendProcessingDocument = documents.some((doc) => isDocumentProcessingStatus(doc.status))
  const isAnyPending =
    uploadMutation.isPending ||
    processMutation.isPending ||
    processWithOptionsMutation.isPending ||
    saveProcessingDefaultsMutation.isPending ||
    clearProcessingDefaultsMutation.isPending ||
    replaceMutation.isPending ||
    deleteMutation.isPending ||
    chunksQuery.isLoading ||
    processingOptionsQuery.isLoading ||
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

  const handleProcessDocumentWithOptions = async () => {
    if (!selectedDocument || !processingOptionsQuery.data) return
    const options = serializeMutableProcessingOptions(processingOptionsQuery.data.options, optionDraft)
    const documentId = selectedDocument.id

    const runProcess = async (allowOverwrite: boolean) => {
      setOptionProcessingDocumentIds((prev) => {
        const next = new Set(prev)
        next.add(documentId)
        return next
      })
      try {
        await processWithOptionsMutation.mutateAsync({ documentId, allowOverwrite, options })
      } finally {
        setOptionProcessingDocumentIds((prev) => {
          const next = new Set(prev)
          next.delete(documentId)
          return next
        })
      }
    }

    const shouldOverwrite = isCompletedOrSuccessfullyProcessed(selectedDocument.status)
      ? window.confirm('This document is already successfully processed. Confirm reprocess and overwrite?')
      : false
    if (isCompletedOrSuccessfullyProcessed(selectedDocument.status) && !shouldOverwrite) {
      return
    }
    try {
      await runProcess(shouldOverwrite)
    } catch (error) {
      if (!shouldOverwrite && error instanceof ApiError && error.status === 409) {
        const confirmed = window.confirm('This document is already successfully processed. Confirm reprocess and overwrite?')
        if (!confirmed) return
        try {
          await runProcess(true)
        } catch {
          // Mutation error state renders the user-facing alert.
        }
      }
    }
  }

  const handleSaveProcessingDefaults = async () => {
    if (!selectedDocumentId || !processingOptionsQuery.data) return
    try {
      await saveProcessingDefaultsMutation.mutateAsync({
        documentId: selectedDocumentId,
        options: serializeMutableProcessingOptions(processingOptionsQuery.data.options, optionDraft),
      })
      setOptionDraftOverride(null)
    } catch {
      // Mutation error state renders the user-facing alert and the draft stays intact.
    }
  }

  const handleClearProcessingDefaults = async () => {
    if (!selectedDocumentId) return
    try {
      await clearProcessingDefaultsMutation.mutateAsync({ documentId: selectedDocumentId })
      setOptionDraftOverride(null)
    } catch {
      // Mutation error state renders the user-facing alert.
    }
  }

  const clearSelectedDocumentIfNeeded = (documentId: string) => {
    if (selectedDocumentId === documentId) {
      setSelectedWorkflow(null)
      setChunkViewMode('readable')
      setOptionDraftOverride(null)
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
        <div>
          <strong>{doc.originalFilename}</strong>
          <small>{doc.sizeBytes} bytes</small>
        </div>,
        <StatusBadge label={doc.status} tone={isDocumentProcessingStatus(doc.status) ? 'warning' : doc.status === 'COMPLETED' ? 'success' : 'neutral'} />,
        <DocumentSourceContext
          doc={doc}
          wasCopied={copiedPathDocumentId === doc.id}
          isOpening={openingDocumentIds.has(doc.id)}
          onOpen={() => handleOpenDocument(doc)}
          onCopy={() => {
            void handleCopyPath(doc)
          }}
        />,
        doc.errorMessage ? <span className='text-red-700'>{doc.errorMessage}</span> : '-',
        <DocumentRowActions
          isProcessing={processingDocumentIds.has(doc.id) || isDocumentProcessingStatus(doc.status)}
          isLoadingChunks={chunksQuery.isLoading && selectedWorkflow?.documentId === doc.id}
          isLoadingOptions={processingOptionsQuery.isLoading && selectedWorkflow?.documentId === doc.id}
          isReplacing={replacingDocumentIds.has(doc.id)}
          isDeleting={deletingDocumentIds.has(doc.id)}
          onProcess={() => {
            void handleProcessDocument(doc.id, doc.status)
          }}
          onReplace={(file) => {
            void handleReplaceDocument(doc.id, file)
          }}
          onViewChunks={() => {
            setSelectedWorkflow({ documentId: doc.id, purpose: 'chunks' })
            setChunkViewMode('readable')
          }}
          onViewOptions={() => {
            setOptionDraftOverride(null)
            setSelectedWorkflow({ documentId: doc.id, purpose: 'processing-options' })
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
      eyebrow='Inline workflow'
      description='Upload, process, inspect chunks, open source context, replace, and delete documents without endpoint tabs.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Workspace', value: selectedKnowledgeBaseId },
            { label: 'Documents', value: String(documents.length) },
          ]}
        />
      }
      topSectionTitle='Document intake and operations'
      topSectionDescription='Multipart upload and row actions are scoped to the selected knowledge base.'
      topSectionStatus={<StatusBadge label={`${documents.length} documents`} tone='neutral' />}
      topSection={
        <div className='stack-lg'>
          <OperationSpine
            ariaLabel='Document workflow status'
            items={[
              { eyebrow: 'Workspace', title: selectedKnowledgeBaseId, body: 'Uploads and list queries use this knowledge-base scope.' },
              { eyebrow: 'Upload', title: uploadMutation.isPending ? 'Uploading' : 'Ready', body: 'Files are submitted as multipart requests.' },
              { eyebrow: 'Processing', title: hasBackendProcessingDocument ? 'Active' : 'Idle', body: 'Processing rows stay locked while backend work is active.' },
              { eyebrow: 'Selection', title: selectedDocumentId ?? 'No document selected', body: 'Choose a row to inspect chunks or processing options.' },
            ]}
          />
          <RuntimeContextSummary
            knowledgeBaseId={selectedKnowledgeBaseId}
            settingHints={['chunk', 'extract', 'embedding', 'document']}
            title='Document processing context'
          />
          {isAnyPending ? <ProgressBanner message='Waiting for document workflow response...' /> : null}
          <section className='stack'>
            <div>
              <span className='eyebrow'>Upload document</span>
              <h3>Select and upload file</h3>
            </div>
            <FileSelectButton
              buttonLabel='Select file to upload'
              testId='documents-upload-select-file'
              onFileSelected={(file) => {
                setSelectedUploadFilename(file.name)
                uploadMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, file })
              }}
            />
            {selectedUploadFilename ? <p>Selected file: {selectedUploadFilename}</p> : null}
            {uploadMutation.error ? <Alert title='Upload failed' message={(uploadMutation.error as Error).message} /> : null}
            {processErrorMessage ? <Alert title='Process failed' message={processErrorMessage} /> : null}
            {openSuccessMessage ? <Alert title='Open requested' message={openSuccessMessage} tone='success' /> : null}
            {openErrorMessage ? <Alert title='Open failed' message={openErrorMessage} /> : null}
            {replaceMutation.error ? <Alert title='Replace failed' message={(replaceMutation.error as Error).message} /> : null}
            {deleteMutation.error ? <Alert title='Delete failed' message={(deleteMutation.error as Error).message} /> : null}
          </section>
          {topSection}
          <section className='stack'>
            <div>
              <span className='eyebrow'>Selected document workflow</span>
              <h3>Chunks and processing options</h3>
            </div>
            {selectedWorkflow ? (
              <>
                <p>Selected document: {selectedDocumentId}</p>
                <div className='view-toggle' aria-label='Selected document workflow purpose'>
                  <ChunkModeButton
                    isActive={selectedWorkflow.purpose === 'chunks'}
                    onClick={() => setSelectedWorkflow({ documentId: selectedWorkflow.documentId, purpose: 'chunks' })}
                  >
                    Chunks
                  </ChunkModeButton>
                  <ChunkModeButton
                    isActive={selectedWorkflow.purpose === 'processing-options'}
                    onClick={() => setSelectedWorkflow({ documentId: selectedWorkflow.documentId, purpose: 'processing-options' })}
                  >
                    Processing options
                  </ChunkModeButton>
                </div>
                {selectedWorkflow.purpose === 'chunks' ? (
                  chunksQuery.isLoading ? (
                    <p>Loading chunks...</p>
                  ) : chunksQuery.error ? (
                    <Alert title='Load chunks failed' message={(chunksQuery.error as Error).message} />
                  ) : (
                    <DocumentChunksInspector chunks={chunksQuery.data ?? []} mode={chunkViewMode} onModeChange={setChunkViewMode} />
                  )
                ) : (
                  <DocumentProcessingOptionsWorkflow
                    data={processingOptionsQuery.data}
                    draft={optionDraft}
                    error={processingOptionsQuery.error}
                    isLoading={processingOptionsQuery.isLoading}
                    isSaving={saveProcessingDefaultsMutation.isPending}
                    isClearing={clearProcessingDefaultsMutation.isPending}
                    isProcessing={selectedDocumentId ? optionProcessingDocumentIds.has(selectedDocumentId) : false}
                    saveError={saveProcessingDefaultsMutation.error}
                    clearError={clearProcessingDefaultsMutation.error}
                    processError={processWithOptionsMutation.error}
                    onDraftChange={(key, value) => {
                      setOptionDraftOverride((prev) => ({ ...(prev ?? loadedOptionDraft), [key]: value }))
                    }}
                    onSave={() => {
                      void handleSaveProcessingDefaults()
                    }}
                    onClear={() => {
                      void handleClearProcessingDefaults()
                    }}
                    onProcess={() => {
                      void handleProcessDocumentWithOptions()
                    }}
                  />
                )}
              </>
            ) : (
              <p>Choose a document in the table above and click View chunks or Options.</p>
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
  isLoadingOptions,
  isReplacing,
  isDeleting,
  onProcess,
  onReplace,
  onViewChunks,
  onViewOptions,
  onDelete,
  replaceTestId,
}: {
  isProcessing: boolean
  isLoadingChunks: boolean
  isLoadingOptions: boolean
  isReplacing: boolean
  isDeleting: boolean
  onProcess: () => void
  onReplace: (file: File) => void
  onViewChunks: () => void
  onViewOptions: () => void
  onDelete: () => void
  replaceTestId: string
}) {
  return (
    <div className='toolbar'>
      <Button
        type='button'
        isPending={isProcessing}
        pendingText='Processing...'
        onClick={onProcess}
        variant='ghost'
      >
        Process
      </Button>
      <FileSelectButton
        buttonLabel='Replace'
        testId={replaceTestId}
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
        variant='ghost'
      >
        View chunks
      </Button>
      <Button
        type='button'
        isPending={isLoadingOptions}
        pendingText='Loading...'
        onClick={onViewOptions}
        variant='ghost'
      >
        Options
      </Button>
      <Button
        type='button'
        variant='danger'
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
    <div className='stack'>
      {hasActions ? (
        <div className='toolbar'>
          <Button
            type='button'
            variant='ghost'
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
            variant='ghost'
            disabled={!doc.localPath}
            onClick={onCopy}
          >
            {wasCopied ? 'Copied' : 'Copy path'}
          </Button>
        </div>
      ) : (
        <span className='muted'>-</span>
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

function DocumentProcessingOptionsWorkflow({
  data,
  draft,
  error,
  isLoading,
  isSaving,
  isClearing,
  isProcessing,
  saveError,
  clearError,
  processError,
  onDraftChange,
  onSave,
  onClear,
  onProcess,
}: {
  data?: DocumentProcessingOptionsResponse
  draft: ProcessingOptionDraft
  error: unknown
  isLoading: boolean
  isSaving: boolean
  isClearing: boolean
  isProcessing: boolean
  saveError: unknown
  clearError: unknown
  processError: unknown
  onDraftChange: (key: string, value: ProcessingOptionDraftValue) => void
  onSave: () => void
  onClear: () => void
  onProcess: () => void
}) {
  if (isLoading) {
    return <p>Loading processing options...</p>
  }

  if (error) {
    return <Alert title='Load processing options failed' message={formatErrorMessage(error)} />
  }

  if (!data) {
    return <p>Select a document from the table to load processing options.</p>
  }

  return (
    <div className='stack' data-testid='document-processing-options-workflow'>
      <div className='badge-row'>
        <StatusBadge label={`Parser: ${data.parserId}`} tone='neutral' />
        <StatusBadge label={`Format: ${data.fileFormat}`} tone='neutral' />
        {data.savedDefaultsUpdatedAt ? <StatusBadge label={`Saved: ${data.savedDefaultsUpdatedAt}`} tone='success' /> : null}
      </div>

      {saveError ? <Alert title='Save defaults failed' message={formatErrorMessage(saveError)} /> : null}
      {clearError ? <Alert title='Clear defaults failed' message={formatErrorMessage(clearError)} /> : null}
      {processError ? <Alert title='Process with options failed' message={formatErrorMessage(processError)} /> : null}

      <div className='stack'>
        {data.options.length === 0 ? (
          <p>No processing options are available for this document.</p>
        ) : (
          data.options.map((option) => (
            <ProcessingOptionControl
              key={option.key}
              option={option}
              value={draft[option.key]}
              onChange={(value) => onDraftChange(option.key, value)}
            />
          ))
        )}
      </div>

      <div className='toolbar'>
        <Button type='button' variant='primary' isPending={isSaving} pendingText='Saving...' onClick={onSave}>
          Save defaults
        </Button>
        <Button type='button' variant='ghost' isPending={isClearing} pendingText='Clearing...' onClick={onClear}>
          Clear defaults
        </Button>
        <Button type='button' variant='ghost' isPending={isProcessing} pendingText='Processing...' onClick={onProcess}>
          Process with options
        </Button>
      </div>
    </div>
  )
}

function ProcessingOptionControl({
  option,
  value,
  onChange,
}: {
  option: DocumentProcessingOptionDefinition
  value: ProcessingOptionDraftValue | undefined
  onChange: (value: ProcessingOptionDraftValue) => void
}) {
  const controlId = `processing-option-${option.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const label = option.label ?? option.key
  const allowedValues = getAllowedValues(option)
  const effectiveValue = value ?? ''

  return (
    <section className='flow-card'>
      <div className='split-stack'>
        <div>
          <h4>{label}</h4>
          <p className='break-anywhere'>{option.key}</p>
        </div>
        <StatusBadge label={option.mutable ? option.valueType : 'Read-only'} tone={option.mutable ? 'neutral' : 'warning'} />
      </div>
      {option.description ? <p>{option.description}</p> : null}

      {option.mutable ? (
        <div>
          {option.valueType === 'BOOLEAN' ? (
            <label className='check-row'>
              <input
                id={controlId}
                type='checkbox'
                checked={effectiveValue === true}
                onChange={(event) => onChange(event.target.checked)}
              />
              <span>Value for {label}</span>
            </label>
          ) : option.valueType === 'INTEGER' ? (
            <>
              <label htmlFor={controlId} className='field-label'>
                Value for {label}
              </label>
              <input
                id={controlId}
                type='number'
                min={getNumericConstraint(option, 'min')}
                max={getNumericConstraint(option, 'max')}
                value={String(effectiveValue)}
                onChange={(event) => onChange(event.target.value)}
              />
            </>
          ) : allowedValues.length > 0 ? (
            <>
              <label htmlFor={controlId} className='field-label'>
                Value for {label}
              </label>
              <select id={controlId} value={String(effectiveValue)} onChange={(event) => onChange(event.target.value)}>
                {!allowedValues.includes(String(effectiveValue)) ? <option value={String(effectiveValue)}>{String(effectiveValue)}</option> : null}
                {allowedValues.map((allowedValue) => (
                  <option key={allowedValue} value={allowedValue}>
                    {allowedValue}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label htmlFor={controlId} className='field-label'>
                Value for {label}
              </label>
              <input
                id={controlId}
                type='text'
                value={String(effectiveValue)}
                onChange={(event) => onChange(event.target.value)}
              />
            </>
          )}
        </div>
      ) : (
        <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
          <dt className='font-semibold'>Value</dt>
          <dd className='break-anywhere muted'>{formatProcessingOptionValue(option.savedDefaultValue ?? option.defaultValue)}</dd>
        </dl>
      )}

      <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
        <dt className='font-semibold'>Built-in default</dt>
        <dd className='break-anywhere muted'>{formatProcessingOptionValue(option.defaultValue)}</dd>
        <dt className='font-semibold'>Saved default</dt>
        <dd className='break-anywhere muted'>{formatProcessingOptionValue(option.savedDefaultValue)}</dd>
        {option.mutable ? (
          <>
            <dt className='font-semibold'>Current draft</dt>
            <dd className='break-anywhere muted'>{formatProcessingOptionValue(typeof effectiveValue === 'boolean' ? effectiveValue : String(effectiveValue))}</dd>
          </>
        ) : null}
      </dl>
    </section>
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
    <div className='stack'>
      <div className='split-stack'>
        <p className='field-label'>Document chunks</p>
        <div className='view-toggle' aria-label='Document chunk view mode'>
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
          className='stack'
        >
          {chunks.length === 0 ? (
            <p>No chunks returned for this document.</p>
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
      className={`tab ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  )
}

function DocumentChunkCard({ chunk }: { chunk: DocumentChunk }) {
  const metadata = parseChunkMetadata(chunk.metadata)
  const source = typeof metadata.source === 'string' ? metadata.source : null
  const pageMetadata = getPageAwareChunkMetadata(metadata)

  return (
    <article className='flow-card'>
      <div className='split-stack'>
        <div>
          <h4>Chunk {chunk.chunkIndex}</h4>
          <p className='break-anywhere'>ID: {chunk.id}</p>
        </div>
        <StatusBadge label={`${chunk.tokenEstimate} tokens`} tone='neutral' />
      </div>

      {source ? (
        <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
          <dt className='font-semibold'>Source</dt>
          <dd className='break-anywhere muted'>{source}</dd>
        </dl>
      ) : null}

      {pageMetadata.length > 0 ? (
        <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
          {pageMetadata.map((item) => (
            <Fragment key={item.label}>
              <dt className='font-semibold'>{item.label}</dt>
              <dd className='break-anywhere muted'>{item.value}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}

      <div className='stack'>
        <p className='field-label'>Text</p>
        <div className='output compact'>
          {chunk.text}
        </div>
      </div>
    </article>
  )
}

function parseChunkMetadata(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function getPageAwareChunkMetadata(metadata: Record<string, unknown>) {
  return [
    { label: 'Page', value: firstPresent(metadata, ['sourcePage', 'pageNumber', 'page_number', 'page']) },
    { label: 'Page count', value: firstPresent(metadata, ['pageCount', 'page_count', 'totalPages', 'total_pages']) },
    { label: 'Parser', value: firstPresent(metadata, ['parserId', 'parser_id', 'parser']) },
    { label: 'File format', value: firstPresent(metadata, ['fileFormat', 'file_format', 'format']) },
    { label: 'Section', value: firstPresent(metadata, ['sectionIndex', 'section_index', 'section']) },
    { label: 'Processing run', value: firstPresent(metadata, ['processingRunId', 'processing_run_id', 'runId', 'run_id']) },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))
}

function firstPresent(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return null
}

function formatErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const fieldMessages = error.fieldErrors
      ? Object.entries(error.fieldErrors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
      : []
    return [error.message, ...(error.details ?? []), ...fieldMessages].filter(Boolean).join(' ')
  }
  return error instanceof Error ? error.message : 'Request failed'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
