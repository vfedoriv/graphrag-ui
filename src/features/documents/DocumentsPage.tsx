import { useMemo, useState } from 'react'
import {
  useDocumentProcessingOptionsQuery,
  useDocumentsQuery,
  useUploadDocumentMutation,
} from '../../api/documents'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import { DocumentProcessingOptionsWorkflow } from './DocumentProcessingOptionsWorkflow'
import { DocumentSourceContext } from './DocumentSourceContext'
import { isDocumentProcessingStatus } from './documentStatus'
import {
  buildProcessingOptionDraft,
  type ProcessingOptionDraft,
} from './processingOptions'
import { useDocumentWorkflowActions } from './useDocumentWorkflowActions'

type SelectedDocumentPurpose = 'processing-options'
type SelectedDocumentWorkflow = {
  documentId: string
  purpose: SelectedDocumentPurpose
}

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const [selectedWorkflow, setSelectedWorkflow] = useState<SelectedDocumentWorkflow | null>(null)
  const [selectedUploadFilename, setSelectedUploadFilename] = useState<string>('')
  const [optionDraftOverride, setOptionDraftOverride] = useState<ProcessingOptionDraft | null>(null)
  const selectedDocumentId = selectedWorkflow?.documentId ?? null
  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedDocumentId) ?? null,
    [documents, selectedDocumentId],
  )
  const processingOptionsQuery = useDocumentProcessingOptionsQuery(
    selectedWorkflow?.purpose === 'processing-options' ? selectedWorkflow.documentId : null,
  )
  const loadedOptionDraft = useMemo(
    () => (processingOptionsQuery.data ? buildProcessingOptionDraft(processingOptionsQuery.data.options) : {}),
    [processingOptionsQuery.data],
  )
  const optionDraft = optionDraftOverride ?? loadedOptionDraft
  const clearSelectedDocumentIfNeeded = (documentId: string) => {
    if (selectedDocumentId === documentId) {
      setSelectedWorkflow(null)
      setOptionDraftOverride(null)
    }
  }
  const documentActions = useDocumentWorkflowActions({
    selectedKnowledgeBaseId,
    selectedDocument,
    selectedDocumentId,
    processingOptionsData: processingOptionsQuery.data,
    optionDraft,
    onClearSelectedDocument: clearSelectedDocumentIfNeeded,
    onResetOptionDraft: () => setOptionDraftOverride(null),
  })
  const {
    processMutation,
    processWithOptionsMutation,
    saveProcessingDefaultsMutation,
    clearProcessingDefaultsMutation,
    replaceMutation,
    deleteMutation,
  } = documentActions.mutations
  const {
    processingDocumentIds,
    optionProcessingDocumentIds,
    replacingDocumentIds,
    deletingDocumentIds,
    openingDocumentIds,
  } = documentActions.pendingIds
  const { copiedPathDocumentId, openErrorMessage, openSuccessMessage } = documentActions.sourceContext
  const hasBackendProcessingDocument = documents.some((doc) => isDocumentProcessingStatus(doc.status))
  const isAnyPending =
    uploadMutation.isPending ||
    processMutation.isPending ||
    processWithOptionsMutation.isPending ||
    saveProcessingDefaultsMutation.isPending ||
    clearProcessingDefaultsMutation.isPending ||
    replaceMutation.isPending ||
    deleteMutation.isPending ||
    processingOptionsQuery.isLoading ||
    hasBackendProcessingDocument

  const { processErrorMessage } = documentActions

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
          onOpen={() => documentActions.handleOpenDocument(doc)}
          onCopy={() => {
            void documentActions.handleCopyPath(doc)
          }}
        />,
        doc.errorMessage ? <span className='text-red-700'>{doc.errorMessage}</span> : '-',
        <DocumentRowActions
          documentId={doc.id}
          isProcessing={processingDocumentIds.has(doc.id) || isDocumentProcessingStatus(doc.status)}
          isLoadingOptions={processingOptionsQuery.isLoading && selectedWorkflow?.documentId === doc.id}
          isReplacing={replacingDocumentIds.has(doc.id)}
          isDeleting={deletingDocumentIds.has(doc.id)}
          onProcess={() => {
            void documentActions.handleProcessDocument(doc.id, doc.status)
          }}
          onReplace={(file) => {
            void documentActions.handleReplaceDocument(doc.id, file)
          }}
          onViewOptions={() => {
            setOptionDraftOverride(null)
            setSelectedWorkflow({ documentId: doc.id, purpose: 'processing-options' })
          }}
          onDelete={() => {
            void documentActions.handleDeleteDocument(doc.id)
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
      description='Upload, process, hand off chunk inspection, open source context, replace, and delete documents without endpoint tabs.'
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
              { eyebrow: 'Selection', title: selectedDocumentId ?? 'No document selected', body: 'Choose a row for processing options or open Chunk Explorer.' },
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
              <h3>Processing options and chunk handoff</h3>
            </div>
            {selectedWorkflow ? (
              <>
                <p>Selected document: {selectedDocumentId}</p>
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
                    void documentActions.handleSaveProcessingDefaults()
                  }}
                  onClear={() => {
                    void documentActions.handleClearProcessingDefaults()
                  }}
                  onProcess={() => {
                    void documentActions.handleProcessDocumentWithOptions()
                  }}
                />
              </>
            ) : (
              <p>Choose a document in the table above for processing options, or use Inspect chunking to open the bounded explorer.</p>
            )}
          </section>
        </div>
      }
      testId='documents-controller-page'
    />
  )
}

function DocumentRowActions({
  documentId,
  isProcessing,
  isLoadingOptions,
  isReplacing,
  isDeleting,
  onProcess,
  onReplace,
  onViewOptions,
  onDelete,
  replaceTestId,
}: {
  documentId: string
  isProcessing: boolean
  isLoadingOptions: boolean
  isReplacing: boolean
  isDeleting: boolean
  onProcess: () => void
  onReplace: (file: File) => void
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
      <a className='button ghost' href={`/chunking?view=chunks&documentId=${encodeURIComponent(documentId)}`}>
        Inspect chunking
      </a>
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
