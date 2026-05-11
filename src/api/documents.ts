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
  process: (documentId: string) => apiFetch<DocumentUpload>(`/documents/${documentId}/process`, { method: 'POST' }),
  chunks: (documentId: string) => apiFetch<DocumentChunk[]>(`/documents/${documentId}/chunks`),
}

export function useDocumentsQuery(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: knowledgeBaseId ? queryKeys.documents(knowledgeBaseId) : ['documents', 'none'],
    queryFn: () => documentsApi.list(knowledgeBaseId as string),
    enabled: Boolean(knowledgeBaseId),
  })
}

export function useDocumentChunksQuery(documentId: string | null) {
  return useQuery({
    queryKey: documentId ? queryKeys.chunks(documentId) : ['documents', 'none', 'chunks'],
    queryFn: () => documentsApi.chunks(documentId as string),
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
    mutationFn: documentsApi.process,
    onSuccess: (doc) => queryClient.invalidateQueries({ queryKey: queryKeys.documents(doc.knowledgeBaseId) }),
  })
}
