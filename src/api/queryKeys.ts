export const queryKeys = {
  knowledgeBases: () => ['knowledge-bases'] as const,
  knowledgeBase: (id: string) => ['knowledge-bases', id] as const,
  schemas: () => ['schemas'] as const,
  schema: (id: string) => ['schemas', id] as const,
  schemaLookup: (id: string) => ['schemas', 'lookup', id] as const,
  documents: (knowledgeBaseId: string) => ['documents', 'knowledge-base', knowledgeBaseId] as const,
  documentsMaybe: (knowledgeBaseId: string | null) =>
    knowledgeBaseId ? queryKeys.documents(knowledgeBaseId) : (['documents', 'knowledge-base', 'none'] as const),
  chunks: (documentId: string) => ['documents', 'chunks', documentId] as const,
  chunksMaybe: (documentId: string | null) =>
    documentId ? queryKeys.chunks(documentId) : (['documents', 'chunks', 'none'] as const),
}
