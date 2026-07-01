import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  DocumentChunk,
  DocumentProcessingOptionsResponse,
  DocumentUpload,
  ProcessDocumentWithOptionsRequest,
  SaveDocumentProcessingDefaultsRequest,
} from './types'

export const documentsApi = {
  list: (knowledgeBaseId: string) => apiFetch<DocumentUpload[]>(`/knowledge-bases/${knowledgeBaseId}/documents`),
  upload: async (knowledgeBaseId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiFetch<DocumentUpload>(`/knowledge-bases/${knowledgeBaseId}/documents`, {
      method: 'POST',
      body: form,
    })
  },
  replace: async (knowledgeBaseId: string, documentId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiFetch<DocumentUpload>(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`, {
      method: 'PUT',
      body: form,
    })
  },
  delete: (knowledgeBaseId: string, documentId: string) =>
    apiFetch<void>(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`, { method: 'DELETE' }),
  process: (documentId: string, allowOverwrite = false) =>
    apiFetch<DocumentUpload>(`/documents/${documentId}/process?allowOverwrite=${allowOverwrite}`, { method: 'POST' }),
  processingOptions: (documentId: string) =>
    apiFetch<DocumentProcessingOptionsResponse>(`/documents/${documentId}/processing-options`),
  saveProcessingDefaults: (documentId: string, payload: SaveDocumentProcessingDefaultsRequest) =>
    apiFetch<DocumentProcessingOptionsResponse>(`/documents/${documentId}/processing-options/defaults`, {
      method: 'PUT',
      body: toJsonBody(payload),
    }),
  clearProcessingDefaults: (documentId: string) =>
    apiFetch<DocumentProcessingOptionsResponse>(`/documents/${documentId}/processing-options/defaults`, {
      method: 'DELETE',
    }),
  processWithOptions: (documentId: string, payload: ProcessDocumentWithOptionsRequest) =>
    apiFetch<DocumentUpload>(`/documents/${documentId}/process`, {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  chunks: (documentId: string) => apiFetch<DocumentChunk[]>(`/documents/${documentId}/chunks`),
}

export function useDocumentsQuery(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: queryKeys.documentsMaybe(knowledgeBaseId),
    queryFn: () => {
      if (!knowledgeBaseId) {
        throw new Error('Cannot load documents without a selected knowledge base')
      }
      return documentsApi.list(knowledgeBaseId)
    },
    enabled: Boolean(knowledgeBaseId),
  })
}

export function useDocumentChunksQuery(documentId: string | null) {
  return useQuery({
    queryKey: queryKeys.chunksMaybe(documentId),
    queryFn: () => {
      if (!documentId) {
        throw new Error('Cannot load chunks without a selected document')
      }
      return documentsApi.chunks(documentId)
    },
    enabled: Boolean(documentId),
  })
}

export function useDocumentProcessingOptionsQuery(documentId: string | null) {
  return useQuery({
    queryKey: queryKeys.documentProcessingOptionsMaybe(documentId),
    queryFn: () => {
      if (!documentId) {
        throw new Error('Cannot load processing options without a selected document')
      }
      return documentsApi.processingOptions(documentId)
    },
    enabled: Boolean(documentId),
  })
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, file }: { knowledgeBaseId: string; file: File }) =>
      documentsApi.upload(knowledgeBaseId, file),
    onSuccess: (doc) => queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) }),
  })
}

export function useReplaceDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, documentId, file }: { knowledgeBaseId: string; documentId: string; file: File }) =>
      documentsApi.replace(knowledgeBaseId, documentId, file),
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.chunks(doc.id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentProcessingOptions(doc.id) })
    },
  })
}

export function useProcessDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, allowOverwrite = false }: { documentId: string; allowOverwrite?: boolean }) =>
      documentsApi.process(documentId, allowOverwrite),
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.chunks(doc.id) })
    },
  })
}

export function useSaveDocumentProcessingDefaultsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, options }: { documentId: string; options: SaveDocumentProcessingDefaultsRequest['options'] }) =>
      documentsApi.saveProcessingDefaults(documentId, { options }),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(queryKeys.documentProcessingOptions(variables.documentId), result)
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentProcessingOptions(variables.documentId) })
    },
  })
}

export function useClearDocumentProcessingDefaultsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId }: { documentId: string }) => documentsApi.clearProcessingDefaults(documentId),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(queryKeys.documentProcessingOptions(variables.documentId), result)
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentProcessingOptions(variables.documentId) })
    },
  })
}

export function useProcessDocumentWithOptionsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, allowOverwrite, options }: { documentId: string } & ProcessDocumentWithOptionsRequest) =>
      documentsApi.processWithOptions(documentId, { allowOverwrite, options }),
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.chunks(doc.id) })
    },
  })
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, documentId }: { knowledgeBaseId: string; documentId: string }) =>
      documentsApi.delete(knowledgeBaseId, documentId),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(variables.knowledgeBaseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.chunks(variables.documentId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentProcessingOptions(variables.documentId) })
    },
  })
}
