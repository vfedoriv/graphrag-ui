export const queryKeys = {
  knowledgeBases: () => ['knowledge-bases'] as const,
  knowledgeBase: (id: string) => ['knowledge-bases', id] as const,
  schemas: () => ['schemas'] as const,
  schema: (id: string) => ['schemas', id] as const,
  documents: (knowledgeBaseId: string) => ['documents', knowledgeBaseId] as const,
  chunks: (documentId: string) => ['documents', documentId, 'chunks'] as const,
}
