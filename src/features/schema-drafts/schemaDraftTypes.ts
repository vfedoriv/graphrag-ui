export type PageResponse<T> = {
  page: number
  size: number
  totalElements: number
  content: T[]
}

export type DraftStatus = 'OPEN' | 'PUBLISHED'
export type AnalysisStatus = 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
export type SourceType = 'DOCUMENT' | 'TEXT' | 'FILE'
export type SourceStatus = 'ACTIVE' | 'STALE' | 'UNAVAILABLE' | 'INACTIVE'
export type SourceResultStatus = 'SUCCEEDED' | 'FAILED' | 'INTERRUPTED'
export type CandidateKind = 'NODE' | 'NODE_PROPERTY' | 'NODE_KEY' | 'RELATIONSHIP' | 'RELATIONSHIP_PROPERTY'
export type EvidenceOrigin = 'OBSERVED' | 'GUIDED' | 'INFERRED' | 'EXISTING'
export type RecommendationState = 'RECOMMENDED' | 'LOW_SUPPORT' | 'REVIEW_REQUIRED' | 'SUPPRESSED'
export type ReviewState = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'PINNED'
export type DecisionType = 'ACCEPT' | 'REJECT' | 'MODIFY' | 'PIN' | 'RESOLVE'
export type Compatibility = 'ADDITIVE' | 'REVIEW_REQUIRED' | 'BREAKING'

export type ConceptRule = { name: string; description: string | null; identityKeys: string[] }
export type NamingRules = {
  nodeLabels: 'PASCAL_CASE' | 'UPPER_SNAKE_CASE' | null
  relationshipTypes: 'UPPER_SNAKE_CASE' | null
  properties: 'CAMEL_CASE' | 'SNAKE_CASE' | null
}
export type PropertyRule = {
  owner: string
  name: string
  type: string
  identity: boolean | null
  required: boolean | null
}
export type RelationshipRule = {
  type: string
  from: string
  to: string
  cardinality: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY' | null
}
export type DiscoveryGuidance = {
  domainDescription: string | null
  intendedQuestions: string[]
  requiredConcepts: ConceptRule[]
  preferredConcepts: ConceptRule[]
  excludedConcepts: string[]
  namingRules: NamingRules | null
  propertyRules: PropertyRule[]
  relationshipRules: RelationshipRule[]
}
export type DraftGuidance = { additionalInstructions: string | null; guidance: DiscoveryGuidance }

export type AnalysisWorkflowReference = {
  id: string
  status: AnalysisStatus
  current: boolean
  statusLocation: string
}
export type EvaluationWorkflowReference = {
  id: string
  status: string
  current: boolean
  latest: boolean
  statusLocation: string
}
export type ReprocessingWorkflowReference = {
  id: string
  status: string
  targetCurrent: boolean
  latest: boolean
  statusLocation: string
}

export type DraftResponse = {
  id: string
  knowledgeBaseId: string
  targetName: string
  targetVersion: number
  baseSchemaId: string | null
  status: DraftStatus
  revision: number
  guidance: DraftGuidance
  guidanceRevision: number
  guidanceFingerprint: string
  currentAggregateId: string | null
  publicationSchemaId: string | null
  publicationContentHash: string | null
  currentPublishedSchemaContentHash: string | null
  publicationContentDrifted: boolean
  activeAiProfileId: string | null
  activeAiProfileRevision: number
  currentAnalysis: AnalysisWorkflowReference | null
  latestEvaluation: EvaluationWorkflowReference | null
  latestReprocessing: ReprocessingWorkflowReference | null
  createdAt: string
  updatedAt: string
}

export type CreateDraftRequest = {
  targetName: string
  targetVersion: number
  baseSchemaId: string | null
  guidance: DraftGuidance
}
export type UpdateDraftRequest = { revision: number; targetName: string; targetVersion: number }
export type UpdateGuidanceRequest = { revision: number; guidance: DraftGuidance }

export type SourceResponse = {
  id: string
  type: SourceType
  status: SourceStatus
  revision: number
  documentId: string | null
  name: string | null
  contentType: string | null
  sizeBytes: number
  sha256: string
  analyzed: boolean
  createdAt: string
  updatedAt: string
}

export type StartAnalysisResponse = { runId: string; status: AnalysisStatus; statusLocation: string }
export type SourceOutcomeResponse = {
  id: string
  sourceId: string
  sourceRevision: number
  status: SourceResultStatus
  reused: boolean
  failureCategory: string | null
  retryable: boolean
  chunkCount: number
  completedAt: string | null
}
export type AnalysisRunResponse = {
  id: string
  status: AnalysisStatus
  draftRevision: number
  guidanceRevision: number
  aiProfileId: string
  aiProfileRevision: number
  promptRevision: string
  candidateRevision: string
  totalSources: number
  succeededSources: number
  failedSources: number
  currentResult: boolean
  aggregateRevisionId: string | null
  failureCategory: string | null
  retryable: boolean
  retryOfRunId: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  sourceOutcomes: PageResponse<SourceOutcomeResponse>
}
export type AnalysisRunSummaryResponse = Omit<AnalysisRunResponse, 'aiProfileId' | 'aiProfileRevision' | 'promptRevision' | 'candidateRevision' | 'currentResult' | 'sourceOutcomes'> & {
  current: boolean
  statusLocation: string
}

export type Evidence = {
  sourceId: string
  sourceFingerprint: string
  chunkId: string | null
  documentId: string | null
  origins: EvidenceOrigin[]
}
export type CandidateResponse = {
  kind: CandidateKind
  identity: string
  label: string | null
  property: string | null
  propertyType: string | null
  keys: string[]
  relationshipType: string | null
  fromLabel: string | null
  toLabel: string | null
  originalLabel: string | null
  originalProperty: string | null
  originalRelationshipType: string | null
  confidence: number | null
  origins: EvidenceOrigin[]
  evidence: Evidence[]
  supportCount: number
  recommendationState: RecommendationState
  effectiveReviewState: ReviewState | null
  latestDecisionId: string | null
}
export type DecisionRequest = {
  revision: number
  type: DecisionType
  candidateIdentity: string
  resultingValue?: unknown
  rationale?: string
}
export type DecisionResponse = {
  id: string
  sequence: number
  draftRevision: number
  type: DecisionType
  reviewState: ReviewState
  candidateIdentity: string
  priorValue: unknown
  resultingValue: unknown
  rationale: string | null
  createdAt: string
}
export type ConflictResponse = {
  id: string
  type: string
  coordinate: string
  alternatives: unknown
  evidence: unknown
  resolved: boolean
  selectedAlternative: string | null
  customResolution: unknown
  createdAt: string
  resolvedAt: string | null
}
export type ResolveConflictRequest = {
  revision: number
  selectedAlternative?: string
  customResolution?: unknown
  rationale?: string
}
export type ProjectionResponse = {
  aggregateRevisionId: string
  draftRevision: number
  schema: unknown
  publicationReady: boolean
}
export type DiffItem = {
  coordinate: string
  compatibility: Compatibility
  operation: string
  before: unknown
  after: unknown
}
export type DiffResponse = { aggregateRevisionId: string; changes: DiffItem[] }

export const emptyDraftGuidance = (): DraftGuidance => ({
  additionalInstructions: null,
  guidance: {
    domainDescription: null,
    intendedQuestions: [],
    requiredConcepts: [],
    preferredConcepts: [],
    excludedConcepts: [],
    namingRules: null,
    propertyRules: [],
    relationshipRules: [],
  },
})

export const isTerminalAnalysisStatus = (status: AnalysisStatus) =>
  status === 'COMPLETED' || status === 'PARTIAL' || status === 'FAILED'
