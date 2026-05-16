import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { queryKeys } from './queryKeys'
import type { DocumentChunk, DocumentUpload } from './types'

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
  process: (documentId: string, allowOverwrite = false) =>
    apiFetch<DocumentUpload>(`/documents/${documentId}/process?allowOverwrite=${allowOverwrite}`, { method: 'POST' }),
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

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, file }: { knowledgeBaseId: string; file: File }) =>
      documentsApi.upload(knowledgeBaseId, file),
    onSuccess: (doc) => queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) }),
  })
}

export function useProcessDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, allowOverwrite = false }: { documentId: string; allowOverwrite?: boolean }) =>
      documentsApi.process(documentId, allowOverwrite),
    onSuccess: (doc) => queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) }),
  })
}
