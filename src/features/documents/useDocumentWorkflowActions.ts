import { useEffect, useState } from 'react'
import {
  useClearDocumentProcessingDefaultsMutation,
  useDeleteDocumentMutation,
  useProcessDocumentMutation,
  useProcessDocumentWithOptionsMutation,
  useReplaceDocumentMutation,
  useSaveDocumentProcessingDefaultsMutation,
} from '../../api/documents'
import { ApiError, type DocumentProcessingOptionsResponse, type DocumentUpload } from '../../api/types'
import { isCompletedOrSuccessfullyProcessed } from './documentStatus'
import { getDocumentOpenTarget, requestLocalFileOpen } from './documentSource'
import { serializeMutableProcessingOptions, type ProcessingOptionDraft } from './processingOptions'

const documentOpenedMessage = 'Document opened in another window'

export function useDocumentWorkflowActions({
  selectedKnowledgeBaseId,
  selectedDocument,
  selectedDocumentId,
  processingOptionsData,
  optionDraft,
  onClearSelectedDocument,
  onResetOptionDraft,
}: {
  selectedKnowledgeBaseId: string | null
  selectedDocument: DocumentUpload | null
  selectedDocumentId: string | null
  processingOptionsData?: DocumentProcessingOptionsResponse
  optionDraft: ProcessingOptionDraft
  onClearSelectedDocument: (documentId: string) => void
  onResetOptionDraft: () => void
}) {
  const processMutation = useProcessDocumentMutation()
  const processWithOptionsMutation = useProcessDocumentWithOptionsMutation()
  const saveProcessingDefaultsMutation = useSaveDocumentProcessingDefaultsMutation()
  const clearProcessingDefaultsMutation = useClearDocumentProcessingDefaultsMutation()
  const replaceMutation = useReplaceDocumentMutation()
  const deleteMutation = useDeleteDocumentMutation()
  const [processingDocumentIds, setProcessingDocumentIds] = useState<Set<string>>(new Set())
  const [optionProcessingDocumentIds, setOptionProcessingDocumentIds] = useState<Set<string>>(new Set())
  const [replacingDocumentIds, setReplacingDocumentIds] = useState<Set<string>>(new Set())
  const [deletingDocumentIds, setDeletingDocumentIds] = useState<Set<string>>(new Set())
  const [copiedPathDocumentId, setCopiedPathDocumentId] = useState<string | null>(null)
  const [openingDocumentIds, setOpeningDocumentIds] = useState<Set<string>>(new Set())
  const [openErrorMessage, setOpenErrorMessage] = useState<string | null>(null)
  const [openSuccessMessage, setOpenSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!openSuccessMessage) return undefined
    const timeoutId = window.setTimeout(() => {
      setOpenSuccessMessage(null)
    }, 10000)
    return () => window.clearTimeout(timeoutId)
  }, [openSuccessMessage])

  const handleProcessDocument = async (documentId: string, status: string) => {
    const runProcess = async (allowOverwrite: boolean) => {
      setProcessingDocumentIds(addPendingId(documentId))
      try {
        await processMutation.mutateAsync({ documentId, allowOverwrite })
      } finally {
        setProcessingDocumentIds(removePendingId(documentId))
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
    if (!selectedDocument || !processingOptionsData) return
    const options = serializeMutableProcessingOptions(processingOptionsData.options, optionDraft)
    const documentId = selectedDocument.id

    const runProcess = async (allowOverwrite: boolean) => {
      setOptionProcessingDocumentIds(addPendingId(documentId))
      try {
        await processWithOptionsMutation.mutateAsync({ documentId, allowOverwrite, options })
      } finally {
        setOptionProcessingDocumentIds(removePendingId(documentId))
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
    if (!selectedDocumentId || !processingOptionsData) return
    try {
      await saveProcessingDefaultsMutation.mutateAsync({
        documentId: selectedDocumentId,
        options: serializeMutableProcessingOptions(processingOptionsData.options, optionDraft),
      })
      onResetOptionDraft()
    } catch {
      // Mutation error state renders the user-facing alert and the draft stays intact.
    }
  }

  const handleClearProcessingDefaults = async () => {
    if (!selectedDocumentId) return
    try {
      await clearProcessingDefaultsMutation.mutateAsync({ documentId: selectedDocumentId })
      onResetOptionDraft()
    } catch {
      // Mutation error state renders the user-facing alert.
    }
  }

  const handleReplaceDocument = async (documentId: string, file: File) => {
    if (!selectedKnowledgeBaseId) return
    const confirmed = window.confirm('Replace this document? Existing processed chunks and extracted artifacts will be cleared.')
    if (!confirmed) return
    setReplacingDocumentIds(addPendingId(documentId))
    try {
      await replaceMutation.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, documentId, file })
      onClearSelectedDocument(documentId)
    } catch {
      // Mutation error state renders the user-facing alert.
    } finally {
      setReplacingDocumentIds(removePendingId(documentId))
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedKnowledgeBaseId) return
    const confirmed = window.confirm('Delete this document and its document-scoped artifacts?')
    if (!confirmed) return
    setDeletingDocumentIds(addPendingId(documentId))
    try {
      await deleteMutation.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, documentId })
      onClearSelectedDocument(documentId)
    } catch {
      // Mutation error state renders the user-facing alert.
    } finally {
      setDeletingDocumentIds(removePendingId(documentId))
    }
  }

  const handleOpenDocument = async (doc: DocumentUpload) => {
    setOpenErrorMessage(null)
    setOpenSuccessMessage(null)
    if (doc.localPath) {
      setOpeningDocumentIds(addPendingId(doc.id))
      try {
        await requestLocalFileOpen(doc.localPath)
        setOpenSuccessMessage(documentOpenedMessage)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to open local file.'
        setOpenErrorMessage(message)
      } finally {
        setOpeningDocumentIds(removePendingId(doc.id))
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

  return {
    mutations: {
      processMutation,
      processWithOptionsMutation,
      saveProcessingDefaultsMutation,
      clearProcessingDefaultsMutation,
      replaceMutation,
      deleteMutation,
    },
    pendingIds: {
      processingDocumentIds,
      optionProcessingDocumentIds,
      replacingDocumentIds,
      deletingDocumentIds,
      openingDocumentIds,
    },
    sourceContext: {
      copiedPathDocumentId,
      openErrorMessage,
      openSuccessMessage,
    },
    processErrorMessage,
    handleProcessDocument,
    handleProcessDocumentWithOptions,
    handleSaveProcessingDefaults,
    handleClearProcessingDefaults,
    handleReplaceDocument,
    handleDeleteDocument,
    handleOpenDocument,
    handleCopyPath,
  }
}

function addPendingId(id: string) {
  return (prev: Set<string>) => {
    const next = new Set(prev)
    next.add(id)
    return next
  }
}

function removePendingId(id: string) {
  return (prev: Set<string>) => {
    const next = new Set(prev)
    next.delete(id)
    return next
  }
}
