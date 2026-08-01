export type ProblemDetailErrors = Record<string, string[] | string> | string[]

export type ProblemDetail = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: ProblemDetailErrors
  [key: string]: unknown
}

export class ApiError extends Error {
  status: number
  title?: string
  fieldErrors?: Record<string, string[]>
  details?: string[]
  problemDetail?: ProblemDetail | null

  constructor(params: {
    status: number
    message: string
    title?: string
    fieldErrors?: Record<string, string[]>
    details?: string[]
    problemDetail?: ProblemDetail | null
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.title = params.title
    this.fieldErrors = params.fieldErrors
    this.details = params.details
    this.problemDetail = params.problemDetail
  }
}

export type KnowledgeBase = {
  id: string
  name: string
  activeSchemaId: string | null
  activeAiProfileId?: string | null
  createdAt: string
}

export type CreateKnowledgeBaseRequest = {
  id: string
  name: string
}

export type UpdateKnowledgeBaseRequest = {
  name: string
}

export type RuntimeSettingValueType = 'BOOLEAN' | 'NUMBER' | 'INTEGER' | 'STRING' | 'JSON' | 'OBJECT' | 'ARRAY' | string

export type RuntimeSetting = {
  key: string
  category: string
  valueType: RuntimeSettingValueType
  currentValue: unknown
  defaultValue: unknown
  activeValue?: unknown
  source: string
  lifecycleState?: string | null
  mutable: boolean
  liveApplied: boolean
  sensitive: boolean
  constraints?: Record<string, unknown> | null
  updateMode: string
  reason?: string | null
  label?: string | null
  description?: string | null
  effectiveChunkerRevision?: string | null
  chunkMigrationLifecycle?: string | null
}

export type UpdateRuntimeSettingRequest = {
  value: unknown
}

export type BulkUpdateRuntimeSettingItem = {
  key: string
  value: unknown
}

export type BulkUpdateRuntimeSettingsRequest = {
  updates: BulkUpdateRuntimeSettingItem[]
}

export type AiProfile = {
  id: string
  name: string
  baseUrl: string
  chatModel: string
  embeddingModel: string
  embeddingDimensions: number
  timeoutSeconds: number
  maxRetries: number
  defaultProfile: boolean
  revision?: number | null
  apiKeyConfigured: boolean
  apiKeyMask?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type CreateAiProfileRequest = {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  chatModel: string
  embeddingModel: string
  embeddingDimensions: number
  timeoutSeconds: number
  maxRetries: number
  defaultProfile: boolean
}

export type UpdateAiProfileRequest = Partial<Omit<CreateAiProfileRequest, 'id'>> & {
  clearApiKey?: boolean
}

export type KnowledgeBaseAiProfileAssignment = {
  knowledgeBaseId?: string
  profileId: string | null
  profile?: AiProfile | null
}

export type UpdateKnowledgeBaseAiProfileRequest = {
  profileId: string | null
}

export type Schema = {
  id: string
  name: string
  version: number
  sourceType: string
  format: SchemaFormat
  contentHash: string
  status: string
  createdAt: string
}

export type SchemaSourceType = 'PREDEFINED' | 'GENERATED'
export type SchemaFormat = 'JSON'

export type SchemaDetails = Schema & {
  content: string
}

export type CreateSchemaRequest = {
  content: string
  sourceType?: SchemaSourceType
  knowledgeBaseId?: string
}

export type UpdateSchemaRequest = {
  content: string
  sourceType?: SchemaSourceType
}

export type ValidateSchemaRequest = {
  content: string
}

export type SchemaValidationResponse = {
  valid: boolean
  errors: string[]
}

export type GenerateSchemaExampleRequest = {
  text: string
  userPrompt?: string
}

export type GenerateSchemaExampleResponse = {
  example: string
}

export type GenerateSchemaExampleRawResponse = string | GenerateSchemaExampleResponse

export type GenerateSchemaRequest = {
  name: string
  version: number
  description?: string
  text: string
  example: string
}

export type GenerateSchemaFromFileRequest = {
  name: string
  version: number
  description?: string
  example: string
  file: File
}

export type GenerateSchemaExampleFromFileRequest = {
  userPrompt?: string
  file: File
}

export type GenerateSchemaResponse = {
  content: string
  warnings?: SchemaGenerationWarning[]
}

export type SchemaGenerationWarning = {
  code?: string
  message: string
  suggestion?: string
  [key: string]: unknown
}

export type DocumentUpload = {
  id: string
  knowledgeBaseId: string
  originalFilename: string
  contentType: string
  sizeBytes: number
  sha256: string
  contentUri: string
  localPath?: string | null
  status: string
  uploadedAt: string
  processedAt: string | null
  errorMessage: string | null
}

export type DocumentChunk = {
  id: string
  documentId: string
  chunkIndex: number
  text: string
  tokenEstimate: number
  kind?: string | null
  parentChunkId?: string | null
  childIndex?: number | null
  childCount?: number
  processingRunId?: string | null
  sectionIndex?: number
  sectionChunkIndex?: number
  sourceStart?: number | null
  sourceEnd?: number | null
  pageStart?: number | null
  pageEnd?: number | null
  structuralPath?: string | null
  blockConfidence?: string | null
  chunkSettingsHash?: string | null
  chunkStrategyRevision?: string | null
  effectiveChunkerRevision?: string | null
  tokenizerId?: string | null
  representationRevision?: string | null
  sourceHash?: string | null
  metadata: string | null
}

export type PageResponse<T> = {
  page: number
  size: number
  totalElements: number
  content: T[]
}

export type ChunkingState = {
  strategy: string
  targetTokens: number
  overlapTokens: number
  hardCharacterLimit: number
  parentTargetTokens: number
  parentHardCharacterLimit: number
  parentMaxPages: number
  contextHeaderMaxTokens: number
  contextHeaderMaxCharacters: number
  representationRevision: string
  valueSources: Record<string, string>
  componentRevisions: ChunkingComponentRevisions
  tokenizerId: string
  tokenizerRevision: string
  tokenCountMode: string
  parserPolicyRevision: string
  settingsHash: string
  effectiveChunkerRevision: string
  migrationLifecycle: string
  compatibilityAliases: ChunkingCompatibilityAlias[]
}

export type ChunkingComponentRevisions = {
  strategyRevision: string
  tokenizerPolicyRevision: string
  tokenizerRevision: string
  parserPolicyRevision: string
  representationRevision: string
}

export type ChunkingCompatibilityAlias = {
  aliasKey: string
  canonicalKey: string
  configuredValue: unknown
  effectiveValue: unknown
  authoritative: boolean
  precedence: string
}

export type DocumentChunkSummary = Omit<DocumentChunk, 'text'>
export type DocumentChunkPage = PageResponse<DocumentChunk>
export type DocumentChunkHierarchy = PageResponse<DocumentChunkSummary> & { flatChunkCount: number }

export type ReprocessingPlanReason = 'SCHEMA_ACTIVATION' | 'CHUNK_STRATEGY_MIGRATION'
export type ChunkReprocessingSelection = 'OUTDATED_STRATEGY' | 'DOCUMENT_IDS' | 'ALL'
export type ReprocessingPlanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'INTERRUPTED'
export type ReprocessingItemStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STALE_SOURCE' | 'BLOCKED_TARGET_CHANGED' | 'BLOCKED' | 'INTERRUPTED' | 'SKIPPED'

export type ReprocessingHistoryFilters = {
  draftId?: string | null
  reason?: ReprocessingPlanReason | null
  selection?: ChunkReprocessingSelection | null
  status?: ReprocessingPlanStatus | null
}

export type CreateReprocessingPlanRequest = {
  draftId?: string | null
  schemaId?: string | null
  allDocuments?: boolean
  documentIds?: string[] | null
  processingOptions?: Record<string, DocumentProcessingOptionValue> | null
  reason?: ReprocessingPlanReason
  selection?: ChunkReprocessingSelection | null
  expectedChunkerRevision?: string | null
}

export type RetryReprocessingPlanRequest = { mode: 'RESNAPSHOT_UNRESOLVED' }
export type StartReprocessingPlanResponse = { planId: string; status: ReprocessingPlanStatus; statusLocation: string }

export type ReprocessingPlanItem = {
  id: string
  documentId: string
  documentSha256: string
  status: ReprocessingItemStatus
  failureCategory: string | null
  retryable: boolean
  priorItemId: string | null
  startedAt: string | null
  completedAt: string | null
}

export type ReprocessingPlanDetail = {
  id: string
  reason: ReprocessingPlanReason
  selection: ChunkReprocessingSelection | null
  expectedChunkerRevision: string | null
  status: ReprocessingPlanStatus
  draftId: string | null
  knowledgeBaseId: string
  schemaId: string | null
  schemaContentHash: string | null
  aiProfileId: string | null
  aiProfileRevision: number | null
  retryOfPlanId: string | null
  totalDocuments: number
  queuedDocuments: number
  runningDocuments: number
  succeededDocuments: number
  failedDocuments: number
  staleDocuments: number
  blockedDocuments: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  items: PageResponse<ReprocessingPlanItem>
}

export type ReprocessingPlanSummary = Omit<ReprocessingPlanDetail, 'knowledgeBaseId' | 'aiProfileId' | 'aiProfileRevision' | 'items'> & {
  latest: boolean
  targetCurrent: boolean
  retryable: boolean
  statusLocation: string
}

export type ChunkMigrationPreviewRequest = {
  selection: ChunkReprocessingSelection
  documentIds?: string[] | null
  processingOptions?: Record<string, unknown> | null
}
export type ChunkMigrationBlocker = { code: string; message: string }
export type ChunkMigrationTarget = {
  schemaId: string | null
  schemaContentHash: string | null
  aiProfileId: string | null
  aiProfileRevision: number
  embeddingSpaceId: string | null
  expectedChunkerRevision: string | null
}
export type ChunkMigrationClassificationCounts = { noChunks: number; outdated: number; current: number }
export type ChunkMigrationDocumentPreview = {
  id: string
  originalFilename: string
  sha256: string
  uploadedAt: string
  classification: string
  effectiveChunkerRevision: string | null
  parserRevision: string | null
}
export type ChunkMigrationPreview = {
  knowledgeBaseId: string
  selection: ChunkReprocessingSelection
  ready: boolean
  blockers: ChunkMigrationBlocker[]
  target: ChunkMigrationTarget | null
  classificationCounts: ChunkMigrationClassificationCounts
  selectedCount: number
  selectedDocuments: PageResponse<ChunkMigrationDocumentPreview>
}

export type AdvancedSearchReadinessIssue = { code: string; description: string }
export type AdvancedSearchReadiness = {
  knowledgeBaseId: string
  ready: boolean
  profileId: string | null
  profileRevision: number
  graphBranchAvailable: boolean
  embeddedCorpusPresent: boolean
  blockers: AdvancedSearchReadinessIssue[]
  informational: AdvancedSearchReadinessIssue[]
}
export type AdvancedSearchCreateRequest = {
  query: string
  maximumEvidence?: number | string | null
  includeEvidenceText?: boolean | null
}
export type AdvancedSearchRunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED' | 'INTERRUPTED'
export type AdvancedSearchRunStage = 'QUEUED' | 'RETRIEVAL' | 'RANKING' | 'SYNTHESIS' | 'TERMINAL'
export type AdvancedSearchRunLinks = Record<string, string>
export type AdvancedSearchRunSummary = {
  id: string
  knowledgeBaseId: string
  queryPreview: string
  maximumEvidence: number
  includeEvidenceText: boolean
  status: AdvancedSearchRunStatus
  stage: AdvancedSearchRunStage
  completedBranches: number
  totalBranches: number
  evidenceCount: number
  cancellationRequested: boolean
  failureCategory: string | null
  deadlineAt: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  links: AdvancedSearchRunLinks
}
export type AdvancedSearchRunDetail = Omit<AdvancedSearchRunSummary, 'queryPreview'> & { query: string }
export type AdvancedSearchRunPage = PageResponse<AdvancedSearchRunSummary>

export type AdvancedSearchSourceRange = { sourceStart: number | null; sourceEnd: number | null; pageStart: number | null; pageEnd: number | null }
export type AdvancedSearchConfidence = { level: string; score: number }
export type AdvancedSearchLimitation = { code: string; description: string }
export type AdvancedSearchClaim = { id: string; kind: string; text: string; citationIds: string[]; graphFactIds: string[]; graphEvidenceIds: string[] }
export type AdvancedSearchAnswer = { version: number; status: string; text: string | null; confidence: AdvancedSearchConfidence | null; limitations: AdvancedSearchLimitation[]; claims: AdvancedSearchClaim[] }
export type AdvancedSearchEvidence = {
  citationId: string
  type: string
  chunkId: string | null
  documentId: string | null
  range: AdvancedSearchSourceRange | null
  processingRunId: string | null
  effectiveChunkerRevision: string | null
  structuralPath: string | null
  text: string | null
  rank: number
  score: number | null
  sourceFilename: string | null
  sourceContentType: string | null
  sourceDisplayLabel: string | null
}
export type AdvancedSearchGraphFact = { factId: string; evidenceIds: string[]; citationIds: string[] }
export type AdvancedSearchAnswerDiagnostics = { repairAttempted: boolean; repairSucceeded: boolean; abstained: boolean; citationCount: number; claimCount: number; outcomeCategory: string }
export type AdvancedSearchPlanDiagnostics = { version: number; promptRevision: string; subquestionCount: number; exactTermCount: number; graphRequestCount: number; metadataConstrained: boolean; fallbackUsed: boolean; fallbackCategory: string | null }
export type AdvancedSearchSufficiencyDiagnostics = { version: number; promptRevision: string; completeCoverageCount: number; partialCoverageCount: number; missingCoverageCount: number; contradictionCount: number; concreteGap: boolean; refinementCount: number; fallbackUsed: boolean; fallbackCategory: string | null }
export type AdvancedSearchFollowUpDiagnostics = { executed: boolean; queryCount: number; skippedCategory: string | null }
export type AdvancedSearchAttemptDiagnostics = { roundNumber: number; subqueryId: string; retriever: string; status: string; candidateCount: number; latencyMs: number; failureCategory: string | null }
export type AdvancedSearchFusionDiagnostics = { acceptedByChannel: Record<string, number>; truncatedByChannel: Record<string, number>; executedSubqueries: Record<string, number>; deduplicatedCandidateCount: number; poolTruncatedCount: number; graphDerivedCandidateCount: number }
export type AdvancedSearchGraphExpansionDiagnostics = { seedCount: number; sourceRowCount: number; attachedFactCount: number }
export type AdvancedSearchParentContextDiagnostics = { evidenceConsidered: number; contextCount: number; tokenEstimate: number; outcomes: Record<string, number> }
export type AdvancedSearchRerankDiagnostics = { poolSize: number; fallbackUsed: boolean; fallbackCategory: string | null }
export type AdvancedSearchSelectionDiagnostics = { requestedMaximum: number; effectivePerDocumentCap: number; comparisonPolicy: boolean; skippedForDiversity: number; selectedByDocument: Record<string, number> }
export type AdvancedSearchSourceMetadataDiagnostics = { warnings: string[] }
export type AdvancedSearchPipelineDiagnostics = {
  plan: AdvancedSearchPlanDiagnostics | null
  sufficiency: AdvancedSearchSufficiencyDiagnostics | null
  followUp: AdvancedSearchFollowUpDiagnostics | null
  attempts: AdvancedSearchAttemptDiagnostics[]
  fusion: AdvancedSearchFusionDiagnostics | null
  graphExpansion: AdvancedSearchGraphExpansionDiagnostics | null
  parentContext: AdvancedSearchParentContextDiagnostics | null
  rerank: AdvancedSearchRerankDiagnostics | null
  selection: AdvancedSearchSelectionDiagnostics | null
  sourceMetadata: AdvancedSearchSourceMetadataDiagnostics | null
}
export type AdvancedSearchResultV1 = {
  payloadVersion: 1
  answer: AdvancedSearchAnswer
  evidence: AdvancedSearchEvidence[]
  contexts: AdvancedSearchEvidence[]
  graphFacts: AdvancedSearchGraphFact[]
  answerDiagnostics: AdvancedSearchAnswerDiagnostics
  diagnostics: AdvancedSearchPipelineDiagnostics
}
export type AdvancedSearchResultEnvelope = { runId: string; payloadVersion: number; result: unknown; createdAt: string }
export type AdvancedSearchResultParseResult =
  | { kind: 'VALID'; envelope: AdvancedSearchResultEnvelope; result: AdvancedSearchResultV1; raw: unknown }
  | { kind: 'UNSUPPORTED_VERSION'; reason: string; raw: unknown; payloadVersion?: number; nestedPayloadVersion?: number }
  | { kind: 'MALFORMED'; reason: string; raw: unknown; issues: string[] }

export type ChunkingStateResponse = ChunkingState
export type DocumentChunkResponse = DocumentChunk
export type DocumentChunkSummaryResponse = DocumentChunkSummary
export type ChunkMigrationPreviewResponse = ChunkMigrationPreview
export type PlanItemResponse = ReprocessingPlanItem
export type PlanResponse = ReprocessingPlanDetail
export type PlanSummaryResponse = ReprocessingPlanSummary
export type AdvancedSearchReadinessResponse = AdvancedSearchReadiness
export type AdvancedSearchResult = AdvancedSearchResultV1
export type AdvancedSearchAnswerResponse = AdvancedSearchAnswer
export type AdvancedSearchEvidenceResponse = AdvancedSearchEvidence
export type AdvancedSearchContextResponse = AdvancedSearchEvidence
export type AdvancedSearchGraphFactResponse = AdvancedSearchGraphFact

export type DocumentProcessingOptionValueType = 'BOOLEAN' | 'INTEGER' | 'STRING'
export type DocumentProcessingOptionValue = boolean | number | string | null

export type DocumentProcessingOptionDefinition = {
  key: string
  valueType: DocumentProcessingOptionValueType
  defaultValue: DocumentProcessingOptionValue
  savedDefaultValue?: DocumentProcessingOptionValue
  mutable: boolean
  label?: string | null
  description?: string | null
  constraints?: {
    min?: number | null
    max?: number | null
    allowedValues?: string[] | null
    [key: string]: unknown
  } | null
  allowedValues?: string[] | null
}

export type DocumentProcessingOptionsResponse = {
  documentId?: string
  parserId: string
  fileFormat: string
  savedDefaults?: Record<string, DocumentProcessingOptionValue> | null
  savedDefaultsUpdatedAt?: string | null
  options: DocumentProcessingOptionDefinition[]
}

export type SaveDocumentProcessingDefaultsRequest = {
  options: Record<string, DocumentProcessingOptionValue>
}

export type ProcessDocumentWithOptionsRequest = {
  allowOverwrite: boolean
  options: Record<string, DocumentProcessingOptionValue>
}

export type QueryGenerateRequest = { prompt: string }

export type QueryValidation = {
  valid: boolean
  cypher: string
  parameters: Record<string, unknown>
  errors: string[]
  maxRows: number
  timeoutSeconds: number
}

export type GeneratedQueryResponse = {
  cypher: string
  explanation: string
  parameters: Record<string, unknown>
  validation: QueryValidation
}

export type QueryValidateRequest = {
  cypher: string
  parameters?: Record<string, unknown>
}

export type QueryExecutionResponse = {
  cypher: string
  parameters: Record<string, unknown>
  validation: QueryValidation
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTimeMs: number
}

export type QueryAskResponse = {
  generatedQuery: GeneratedQueryResponse
  execution: QueryExecutionResponse
}

export type HybridSearchRequest = {
  query: string
  topK?: number
  graphDepth?: number
  includeChunkText?: boolean
}

export type HybridSearchSource = {
  documentId: string
  originalFilename?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  chunkMetadata?: string | Record<string, unknown> | null
  filename?: string | null
  metadata?: Record<string, unknown>
}

export type HybridSearchGraphEntity = {
  elementId?: string
  labels?: string[]
  properties: Record<string, unknown>
  id?: string
}

export type HybridSearchGraphRelationship = {
  elementId?: string
  type: string
  startNodeElementId?: string
  endNodeElementId?: string
  properties: Record<string, unknown>
  id?: string
  startEntityId?: string
  endEntityId?: string
  startElementId?: string
  endElementId?: string
}

export type HybridSearchGraphContext = {
  entities: HybridSearchGraphEntity[]
  relationships: HybridSearchGraphRelationship[]
}

export type HybridSearchHit = {
  chunkId: string
  documentId: string
  chunkIndex: number
  score: number
  text?: string | null
  source: HybridSearchSource
  graph?: HybridSearchGraphContext | null
  graphContext?: HybridSearchGraphContext | null
}

export type HybridSearchResponse = {
  query: string
  topK: number
  graphDepth: number
  includeChunkText: boolean
  hits: HybridSearchHit[]
  hitCount: number
  executionTimeMs: number
}
