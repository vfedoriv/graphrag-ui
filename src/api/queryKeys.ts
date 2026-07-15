export const queryKeys = {
  knowledgeBases: () => ['knowledge-bases'] as const,
  knowledgeBase: (id: string) => ['knowledge-bases', id] as const,
  knowledgeBaseActiveAiProfile: (id: string) => ['knowledge-bases', id, 'active-ai-profile'] as const,
  runtimeSettings: () => ['runtime-settings'] as const,
  aiProfiles: () => ['ai-profiles'] as const,
  aiProfile: (id: string) => ['ai-profiles', id] as const,
  schemas: () => ['schemas'] as const,
  schemasByKnowledgeBase: (knowledgeBaseId: string) => ['schemas', 'knowledge-base', knowledgeBaseId] as const,
  schemasByKnowledgeBaseMaybe: (knowledgeBaseId: string | null) =>
    knowledgeBaseId ? queryKeys.schemasByKnowledgeBase(knowledgeBaseId) : (['schemas', 'knowledge-base', 'none'] as const),
  schema: (id: string) => ['schemas', id] as const,
  schemaLookup: (id: string) => ['schemas', 'lookup', id] as const,
  documents: (knowledgeBaseId: string) => ['documents', 'knowledge-base', knowledgeBaseId] as const,
  documentsMaybe: (knowledgeBaseId: string | null) =>
    knowledgeBaseId ? queryKeys.documents(knowledgeBaseId) : (['documents', 'knowledge-base', 'none'] as const),
  chunks: (documentId: string) => ['documents', 'chunks', documentId] as const,
  chunksMaybe: (documentId: string | null) =>
    documentId ? queryKeys.chunks(documentId) : (['documents', 'chunks', 'none'] as const),
  documentProcessingOptions: (documentId: string) => ['documents', 'processing-options', documentId] as const,
  documentProcessingOptionsMaybe: (documentId: string | null) =>
    documentId ? queryKeys.documentProcessingOptions(documentId) : (['documents', 'processing-options', 'none'] as const),
  schemaDrafts: (knowledgeBaseId: string) => ['schema-drafts', knowledgeBaseId] as const,
  schemaDraftsMaybe: (knowledgeBaseId: string | null) =>
    knowledgeBaseId ? queryKeys.schemaDrafts(knowledgeBaseId) : (['schema-drafts', 'none'] as const),
  schemaDraft: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'detail'] as const,
  schemaDraftMaybe: (knowledgeBaseId: string | null, draftId: string | null) =>
    knowledgeBaseId && draftId ? queryKeys.schemaDraft(knowledgeBaseId, draftId) : (['schema-drafts', 'none', 'none', 'detail'] as const),
  schemaDraftSources: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'sources'] as const,
  schemaDraftSourcesMaybe: (knowledgeBaseId: string | null, draftId: string | null) =>
    knowledgeBaseId && draftId ? queryKeys.schemaDraftSources(knowledgeBaseId, draftId) : (['schema-drafts', 'none', 'none', 'sources'] as const),
  schemaDraftAnalysisHistory: (knowledgeBaseId: string, draftId: string, page: number, size: number) =>
    ['schema-drafts', knowledgeBaseId, draftId, 'analysis-runs', 'history', page, size] as const,
  schemaDraftAnalysisHistoryMaybe: (knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) =>
    knowledgeBaseId && draftId ? queryKeys.schemaDraftAnalysisHistory(knowledgeBaseId, draftId, page, size) : (['schema-drafts', 'none', 'none', 'analysis-runs', 'history', page, size] as const),
  schemaDraftAnalysisRun: (knowledgeBaseId: string, draftId: string, runId: string, page: number, size: number) =>
    ['schema-drafts', knowledgeBaseId, draftId, 'analysis-runs', runId, page, size] as const,
  schemaDraftAnalysisRunMaybe: (knowledgeBaseId: string | null, draftId: string | null, runId: string | null, page: number, size: number) =>
    knowledgeBaseId && draftId && runId ? queryKeys.schemaDraftAnalysisRun(knowledgeBaseId, draftId, runId, page, size) : (['schema-drafts', 'none', 'none', 'analysis-runs', 'none', page, size] as const),
  schemaDraftCandidates: (knowledgeBaseId: string, draftId: string, page: number, size: number) =>
    ['schema-drafts', knowledgeBaseId, draftId, 'candidates', page, size] as const,
  schemaDraftCandidatesMaybe: (knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) =>
    knowledgeBaseId && draftId ? queryKeys.schemaDraftCandidates(knowledgeBaseId, draftId, page, size) : (['schema-drafts', 'none', 'none', 'candidates', page, size] as const),
  schemaDraftDecisions: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'decisions'] as const,
  schemaDraftConflicts: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'conflicts'] as const,
  schemaDraftProjection: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'projection'] as const,
  schemaDraftDiff: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'diff'] as const,
}
