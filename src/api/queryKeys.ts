export const queryKeys = {
  knowledgeBases: () => ['knowledge-bases'] as const,
  knowledgeBase: (id: string) => ['knowledge-bases', id] as const,
  knowledgeBaseActiveAiProfile: (id: string) => ['knowledge-bases', id, 'active-ai-profile'] as const,
  runtimeSettings: () => ['runtime-settings'] as const,
  chunkingState: () => ['chunking-state'] as const,
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
  chunkHierarchy: (documentId: string, page: number, size: number) =>
    ['documents', 'chunks', documentId, 'hierarchy', page, size] as const,
  chunkHierarchyMaybe: (documentId: string | null, page: number, size: number) =>
    documentId ? queryKeys.chunkHierarchy(documentId, page, size) : (['documents', 'chunks', 'none', 'hierarchy', page, size] as const),
  chunkPage: (documentId: string, page: number, size: number, kind?: string | null, parentChunkId?: string | null, sectionIndex?: number | null) =>
    ['documents', 'chunks', documentId, 'page', page, size, kind ?? 'none', parentChunkId ?? 'none', sectionIndex ?? 'none'] as const,
  chunkPageMaybe: (documentId: string | null, page: number, size: number, kind?: string | null, parentChunkId?: string | null, sectionIndex?: number | null) =>
    documentId ? queryKeys.chunkPage(documentId, page, size, kind, parentChunkId, sectionIndex) : ['documents', 'chunks', 'none', 'page', page, size, kind ?? 'none', parentChunkId ?? 'none', sectionIndex ?? 'none'] as const,
  chunkDirect: (documentId: string, chunkId: string) => ['documents', 'chunks', documentId, 'direct', chunkId] as const,
  chunkDirectMaybe: (documentId: string | null, chunkId: string | null) =>
    documentId && chunkId ? queryKeys.chunkDirect(documentId, chunkId) : (['documents', 'chunks', 'none', 'direct', 'none'] as const),
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
  schemaDraftCandidates: (knowledgeBaseId: string, draftId: string) =>
    ['schema-drafts', knowledgeBaseId, draftId, 'candidates'] as const,
  schemaDraftCandidatesMaybe: (knowledgeBaseId: string | null, draftId: string | null) =>
    knowledgeBaseId && draftId ? queryKeys.schemaDraftCandidates(knowledgeBaseId, draftId) : (['schema-drafts', 'none', 'none', 'candidates'] as const),
  schemaDraftDecisions: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'decisions'] as const,
  schemaDraftConflicts: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'conflicts'] as const,
  schemaDraftProjection: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'projection'] as const,
  schemaDraftDiff: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'diff'] as const,
  schemaDraftEvaluationEligibility: (knowledgeBaseId: string, draftId: string, page: number, size: number) => ['schema-drafts', knowledgeBaseId, draftId, 'evaluation-eligibility', page, size] as const,
  schemaDraftEvaluationEligibilityMaybe: (knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) => knowledgeBaseId && draftId ? queryKeys.schemaDraftEvaluationEligibility(knowledgeBaseId, draftId, page, size) : ['schema-drafts', 'none', 'none', 'evaluation-eligibility', page, size] as const,
  schemaDraftEvaluationHistory: (knowledgeBaseId: string, draftId: string, page: number, size: number) => ['schema-drafts', knowledgeBaseId, draftId, 'evaluation-runs', 'history', page, size] as const,
  schemaDraftEvaluationHistoryMaybe: (knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) => knowledgeBaseId && draftId ? queryKeys.schemaDraftEvaluationHistory(knowledgeBaseId, draftId, page, size) : ['schema-drafts', 'none', 'none', 'evaluation-runs', 'history', page, size] as const,
  schemaDraftEvaluation: (knowledgeBaseId: string, draftId: string, runId: string, page: number, size: number) => ['schema-drafts', knowledgeBaseId, draftId, 'evaluation-runs', runId, page, size] as const,
  schemaDraftEvaluationMaybe: (knowledgeBaseId: string | null, draftId: string | null, runId: string | null, page: number, size: number) => knowledgeBaseId && draftId && runId ? queryKeys.schemaDraftEvaluation(knowledgeBaseId, draftId, runId, page, size) : ['schema-drafts', 'none', 'none', 'evaluation-runs', 'none', page, size] as const,
  schemaDraftReadiness: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'publication-readiness'] as const,
  schemaDraftReadinessMaybe: (knowledgeBaseId: string | null, draftId: string | null) => knowledgeBaseId && draftId ? queryKeys.schemaDraftReadiness(knowledgeBaseId, draftId) : ['schema-drafts', 'none', 'none', 'publication-readiness'] as const,
  schemaDraftPublication: (knowledgeBaseId: string, draftId: string) => ['schema-drafts', knowledgeBaseId, draftId, 'publication'] as const,
  schemaDraftPublicationMaybe: (knowledgeBaseId: string | null, draftId: string | null) => knowledgeBaseId && draftId ? queryKeys.schemaDraftPublication(knowledgeBaseId, draftId) : ['schema-drafts', 'none', 'none', 'publication'] as const,
  reprocessingPlanHistory: (knowledgeBaseId: string, draftId: string, page: number, size: number, reason?: string | null, selection?: string | null, status?: string | null) => reason == null && selection == null && status == null ? ['reprocessing-plans', knowledgeBaseId, draftId, 'history', page, size] as const : ['reprocessing-plans', knowledgeBaseId, draftId, 'history', reason ?? 'none', selection ?? 'none', status ?? 'none', page, size] as const,
  reprocessingPlanHistoryMaybe: (knowledgeBaseId: string | null, draftId: string | null, page: number, size: number) => knowledgeBaseId && draftId ? queryKeys.reprocessingPlanHistory(knowledgeBaseId, draftId, page, size) : ['reprocessing-plans', 'none', 'none', 'history', page, size] as const,
  reprocessingPlanHistoryFiltered: (knowledgeBaseId: string, filters: { draftId?: string | null; reason?: string | null; selection?: string | null; status?: string | null }, page: number, size: number) =>
    ['reprocessing-plans', knowledgeBaseId, 'history', filters.draftId ?? 'none', filters.reason ?? 'none', filters.selection ?? 'none', filters.status ?? 'none', page, size] as const,
  reprocessingPlanHistoryFilteredMaybe: (knowledgeBaseId: string | null, filters: { draftId?: string | null; reason?: string | null; selection?: string | null; status?: string | null }, page: number, size: number) =>
    knowledgeBaseId ? queryKeys.reprocessingPlanHistoryFiltered(knowledgeBaseId, filters, page, size) : ['reprocessing-plans', 'none', 'history', filters.draftId ?? 'none', filters.reason ?? 'none', filters.selection ?? 'none', filters.status ?? 'none', page, size] as const,
  reprocessingPlan: (knowledgeBaseId: string, planId: string, page: number, size: number) => ['reprocessing-plans', knowledgeBaseId, planId, page, size] as const,
  reprocessingPlanMaybe: (knowledgeBaseId: string | null, planId: string | null, page: number, size: number) => knowledgeBaseId && planId ? queryKeys.reprocessingPlan(knowledgeBaseId, planId, page, size) : ['reprocessing-plans', 'none', 'none', page, size] as const,
  advancedSearch: (knowledgeBaseId: string) => ['advanced-search', knowledgeBaseId] as const,
  advancedSearchMaybe: (knowledgeBaseId: string | null) => knowledgeBaseId ? queryKeys.advancedSearch(knowledgeBaseId) : (['advanced-search', 'none'] as const),
  advancedSearchReadiness: (knowledgeBaseId: string) => ['advanced-search', knowledgeBaseId, 'readiness'] as const,
  advancedSearchReadinessMaybe: (knowledgeBaseId: string | null) => knowledgeBaseId ? queryKeys.advancedSearchReadiness(knowledgeBaseId) : (['advanced-search', 'none', 'readiness'] as const),
  advancedSearchHistory: (knowledgeBaseId: string, status: string | null, page: number, size: number) => ['advanced-search', knowledgeBaseId, 'history', status ?? 'none', page, size] as const,
  advancedSearchHistoryMaybe: (knowledgeBaseId: string | null, status: string | null, page: number, size: number) => knowledgeBaseId ? queryKeys.advancedSearchHistory(knowledgeBaseId, status, page, size) : ['advanced-search', 'none', 'history', status ?? 'none', page, size] as const,
  advancedSearchRun: (knowledgeBaseId: string, runId: string) => ['advanced-search', knowledgeBaseId, 'runs', runId] as const,
  advancedSearchRunMaybe: (knowledgeBaseId: string | null, runId: string | null) => knowledgeBaseId && runId ? queryKeys.advancedSearchRun(knowledgeBaseId, runId) : (['advanced-search', 'none', 'runs', 'none'] as const),
  advancedSearchResult: (knowledgeBaseId: string, runId: string) => ['advanced-search', knowledgeBaseId, 'runs', runId, 'result'] as const,
  advancedSearchResultMaybe: (knowledgeBaseId: string | null, runId: string | null) => knowledgeBaseId && runId ? queryKeys.advancedSearchResult(knowledgeBaseId, runId) : (['advanced-search', 'none', 'runs', 'none', 'result'] as const),
}
