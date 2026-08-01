import type { AnalysisRunResponse, AnalysisRunSummaryResponse, CandidateResponse, DiffResponse, DraftResponse, PageResponse } from './schemaDraftTypes'
import { emptyDraftGuidance } from './schemaDraftTypes'
import type { EligibilityPage, EvaluationRun, EvaluationRunSummary, Publication, PublicationReadiness, ReprocessingPlan, ReprocessingPlanSummary } from './schemaDraftReleaseTypes'

export const canonicalGuidance = {
  additionalInstructions: 'Prefer stable business identifiers.',
  guidance: {
    ...emptyDraftGuidance().guidance,
    domainDescription: 'A support domain with customers and tickets.',
    intendedQuestions: ['Which tickets are open for a customer?'],
    requiredConcepts: [{ name: 'Customer', description: 'A support customer', identityKeys: ['customerId'] }],
    preferredConcepts: [{ name: 'Ticket', description: 'A support case', identityKeys: ['ticketId'] }],
    excludedConcepts: ['InternalNote'],
    namingRules: { nodeLabels: 'PASCAL_CASE' as const, relationshipTypes: 'UPPER_SNAKE_CASE' as const, properties: 'CAMEL_CASE' as const },
    propertyRules: [{ owner: 'Customer', name: 'customerId', type: 'STRING', identity: true, required: true }],
    relationshipRules: [{ type: 'OPENED', from: 'Customer', to: 'Ticket', cardinality: 'ONE_TO_MANY' as const }],
  },
}

export const draftFixture: DraftResponse = {
  id: 'draft-1', knowledgeBaseId: 'kb-1', targetName: 'Support', targetVersion: 2, baseSchemaId: 'schema-1', status: 'OPEN', revision: 7,
  guidance: canonicalGuidance, guidanceRevision: 3, guidanceFingerprint: 'guidance-sha', currentAggregateId: 'aggregate-1',
  publicationSchemaId: null, publicationContentHash: null, currentPublishedSchemaContentHash: null, publicationContentDrifted: false,
  activeAiProfileId: 'profile-1', activeAiProfileRevision: 2,
  currentAnalysis: { id: 'run-running', status: 'RUNNING', current: true, statusLocation: '/api/v1/knowledge-bases/kb-1/schema-drafts/draft-1/analysis-runs/run-running' },
  latestEvaluation: null, latestReprocessing: null, createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T09:00:00Z',
}

const runBase = {
  draftRevision: 7, guidanceRevision: 3, totalSources: 3, succeededSources: 2, failedSources: 1,
  effectiveSourceConcurrency: 4, effectiveSourceTimeoutMillis: 60_000, effectiveRequestTimeoutMillis: 180_000,
  aggregateRevisionId: 'aggregate-1', failureCategory: null, retryable: false, canRetry: true, retryOfRunId: null,
  createdAt: '2026-07-15T08:00:00Z', startedAt: '2026-07-15T08:00:01Z', completedAt: '2026-07-15T08:01:00Z',
}
export const analysisHistoryFixture: PageResponse<AnalysisRunSummaryResponse> = {
  page: 0, size: 20, totalElements: 4, content: [
    { ...runBase, id: 'run-running', status: 'RUNNING', current: true, succeededSources: 1, failedSources: 0, aggregateRevisionId: null, canRetry: false, completedAt: null, statusLocation: '/runs/run-running' },
    { ...runBase, id: 'run-partial', status: 'PARTIAL', current: true, retryable: true, statusLocation: '/runs/run-partial' },
    { ...runBase, id: 'run-failed', status: 'FAILED', current: false, succeededSources: 0, failedSources: 3, aggregateRevisionId: null, failureCategory: 'PROVIDER_ERROR', retryable: true, statusLocation: '/runs/run-failed' },
    { ...runBase, id: 'run-retry', status: 'COMPLETED', current: false, succeededSources: 3, failedSources: 0, retryOfRunId: 'run-partial', statusLocation: '/runs/run-retry' },
  ],
}
export const analysisDetailFixture: AnalysisRunResponse = {
  ...runBase, id: 'run-partial', status: 'PARTIAL', aiProfileId: 'profile-1', aiProfileRevision: 2,
  promptRevision: 'prompt-v1', candidateRevision: 'candidate-v1', currentResult: true, retryable: true,
  sourceOutcomes: { page: 0, size: 20, totalElements: 3, content: [
    { id: 'outcome-1', sourceId: 'source-1', sourceRevision: 1, status: 'SUCCEEDED', reused: true, failureCategory: null, failureCode: null, retryable: false, chunkCount: 8, completedAt: '2026-07-15T08:00:30Z' },
    { id: 'outcome-2', sourceId: 'source-2', sourceRevision: 1, status: 'FAILED', reused: false, failureCategory: 'TIMEOUT', failureCode: 'SOURCE_DEADLINE_EXCEEDED', retryable: true, chunkCount: 0, completedAt: '2026-07-15T08:00:45Z' },
  ] },
}

export const legacyAnalysisDetailFixture: AnalysisRunResponse = {
  ...analysisDetailFixture,
  id: 'run-legacy',
  effectiveSourceConcurrency: null,
  effectiveSourceTimeoutMillis: null,
  effectiveRequestTimeoutMillis: null,
  canRetry: false,
  sourceOutcomes: {
    ...analysisDetailFixture.sourceOutcomes,
    content: analysisDetailFixture.sourceOutcomes.content.map((outcome) => ({ ...outcome, failureCode: null })),
  },
}

export const legacyAnalysisHistoryFixture: PageResponse<AnalysisRunSummaryResponse> = {
  page: 0,
  size: 20,
  totalElements: 1,
  content: [{
    ...analysisHistoryFixture.content[1],
    id: 'run-legacy',
    effectiveSourceConcurrency: null,
    effectiveSourceTimeoutMillis: null,
    effectiveRequestTimeoutMillis: null,
    canRetry: false,
  }],
}

export const candidateFixture: CandidateResponse = {
  kind: 'NODE_PROPERTY', identity: 'node-property:Customer:customerId', label: 'Customer', property: 'customerId', propertyType: 'STRING', keys: [],
  relationshipType: null, fromLabel: null, toLabel: null, originalLabel: null, originalProperty: null, originalRelationshipType: null,
  confidence: 0.97, origins: ['OBSERVED', 'GUIDED'], supportCount: 4, recommendationState: 'RECOMMENDED', effectiveReviewState: 'PINNED', latestDecisionId: 'decision-4',
  evidence: [{ sourceId: 'source-1', sourceFingerprint: 'source-sha', chunkId: 'chunk-2', documentId: 'document-1', origins: ['OBSERVED'] }],
}
export const candidatePageFixture: PageResponse<CandidateResponse> = { page: 0, size: 50, totalElements: 1, content: [candidateFixture] }

const diffChanges: DiffResponse['changes'] = [
  { coordinate: 'Customer.age', compatibility: 'BREAKING', operation: 'CHANGE_TYPE', before: 'STRING', after: 'INTEGER' },
]
export const baseSchemaDiffFixture: DiffResponse = {
  aggregateRevisionId: 'aggregate-1', draftRevision: 7,
  baseline: { type: 'BASE_SCHEMA', id: 'schema-1', contentHash: 'base-schema-sha' }, changes: diffChanges,
}
export const previousAggregateDiffFixture: DiffResponse = {
  aggregateRevisionId: 'aggregate-1', draftRevision: 7,
  baseline: { type: 'PREVIOUS_AGGREGATE', id: 'aggregate-0', contentHash: 'previous-aggregate-sha' }, changes: diffChanges,
}
export const emptyBaselineDiffFixture: DiffResponse = {
  aggregateRevisionId: 'aggregate-1', draftRevision: 7,
  baseline: { type: 'EMPTY', id: null, contentHash: 'empty-schema-sha' }, changes: diffChanges,
}
export const rolloutCompatibleDiffFixture: DiffResponse = { aggregateRevisionId: 'aggregate-1', changes: diffChanges }

const candidateVariant = (identity: string, overrides: Partial<CandidateResponse>): CandidateResponse => ({
  ...candidateFixture,
  identity,
  evidence: [],
  origins: ['OBSERVED'],
  effectiveReviewState: null,
  latestDecisionId: null,
  ...overrides,
})

export const candidateReviewFixtures: CandidateResponse[] = [
  candidateVariant('node:Customer', { kind: 'NODE', label: 'Customer', property: null, propertyType: null, supportCount: 2, recommendationState: 'RECOMMENDED' }),
  candidateVariant('node:Account', { kind: 'NODE', label: 'Account', property: null, propertyType: null, supportCount: 1, effectiveReviewState: 'ACCEPTED', latestDecisionId: 'decision-accepted' }),
  candidateVariant('node:DeprecatedTag', { kind: 'NODE', label: 'DeprecatedTag', property: null, propertyType: null, supportCount: 1, effectiveReviewState: 'REJECTED', latestDecisionId: 'decision-rejected' }),
  candidateVariant('node:GuidedConcept', { kind: 'NODE', label: 'GuidedConcept', property: null, propertyType: null, origins: ['GUIDED'], supportCount: 0, confidence: null, recommendationState: 'REVIEW_REQUIRED' }),
  candidateVariant('node-property:Ticket:priority', { kind: 'NODE_PROPERTY', label: 'Ticket', property: 'priority', propertyType: 'STRING', supportCount: 1, recommendationState: 'LOW_SUPPORT' }),
  candidateVariant('node-property:Customer:customerId', { kind: 'NODE_PROPERTY', label: 'Customer', originalLabel: 'customer', property: 'customerId', originalProperty: 'customer_id', propertyType: 'STRING', supportCount: 1 }),
  candidateVariant('relationship:Customer:OPENED:Ticket', { kind: 'RELATIONSHIP', label: null, property: null, propertyType: null, relationshipType: 'OPENED', originalRelationshipType: 'opened', fromLabel: 'Customer', toLabel: 'Ticket', supportCount: 1 }),
  candidateVariant('node-property:Ticket:status', { kind: 'NODE_PROPERTY', label: 'Ticket', property: 'status', propertyType: 'STRING', supportCount: 1, evidence: [
    { sourceId: 'source-shared', sourceFingerprint: 'shared-sha', documentId: 'document-shared', chunkId: 'chunk-1', origins: ['OBSERVED'] },
    { sourceId: 'source-shared', sourceFingerprint: 'shared-sha', documentId: 'document-shared', chunkId: 'chunk-2', origins: ['OBSERVED'] },
  ] }),
]

export const candidateReviewPageFixture: PageResponse<CandidateResponse> = { page: 0, size: 25, totalElements: candidateReviewFixtures.length, content: candidateReviewFixtures }

export const validationProblemFixture = {
  type: 'about:blank', title: 'Validation failed', status: 400, detail: 'Draft guidance is invalid',
  errors: { 'guidance.guidance.requiredConcepts[0].name': ['must not be blank'] },
}

export const eligibilityFixture: EligibilityPage = {
  draftRevision: 7, currentAggregateId: 'aggregate-1', readiness: 'READY', blockingReason: null, page: 0, size: 20, totalElements: 2,
  content: [
    { documentId: 'held-out-1', filename: 'held-out.txt', contentType: 'text/plain', sizeBytes: 120, sha256: 'held-out-sha', uploadedAt: '2026-07-15T07:00:00Z', eligible: true, ineligibilityReason: null },
    { documentId: 'document-1', filename: 'discovery.txt', contentType: 'text/plain', sizeBytes: 240, sha256: 'discovery-sha', uploadedAt: '2026-07-15T07:01:00Z', eligible: false, ineligibilityReason: 'ACTIVE_DISCOVERY_EVIDENCE' },
  ],
}
export const analysisRequiredEligibilityFixture: EligibilityPage = {
  ...eligibilityFixture,
  readiness: 'NOT_READY',
  blockingReason: 'DRAFT_ANALYSIS_REQUIRED',
  content: eligibilityFixture.content.map((item) => ({ ...item, eligible: false, ineligibilityReason: 'DRAFT_ANALYSIS_REQUIRED' })),
}
const metrics = {
  rates: [
    { metric: 'RECOGNIZED_ENTITY_RATE' as const, numerator: 8, denominator: 10, value: 0.8, applicability: 'APPLICABLE' as const, evidence: [{ coordinate: 'nodes.Customer' }] },
    { metric: 'KEY_AVAILABILITY_RATE' as const, numerator: 0, denominator: 0, value: null, applicability: 'NOT_APPLICABLE' as const, evidence: [] },
  ],
  counts: [
    { metric: 'PROPERTY_TYPE_CONFLICTS' as const, count: 1, evidence: [{ coordinate: 'nodes.Customer.properties.customerId' }] },
    { metric: 'LOW_SUPPORT_CANDIDATES' as const, count: 2, evidence: [{ coordinate: 'nodes.Ticket' }] },
  ],
  reasons: [{ code: 'HELD_OUT_MISMATCH', detail: 'One property type differed from the reviewed projection.' }],
}
const advisoryAssessment = {
  status: 'COMPLETED' as const,
  intendedQuestions: [{ questionFingerprint: 'question-sha', coverage: 'PARTIALLY_SUPPORTED' as const, reasons: [{ code: 'MISSING_PATH', detail: 'The escalation path is not represented.' }], schemaCoordinates: ['relationships.ESCALATED_TO'] }],
  schemaNoise: [{ schemaCoordinate: 'nodes.InternalTag', assessment: 'POSSIBLE_NOISE', reasons: [{ code: 'LOW_UTILITY', detail: 'No intended question references this concept.' }] }],
  reasons: [], warnings: ['Advisory judgments are model-generated.'],
  reproducibility: { profileId: 'profile-1', profileRevision: 2, promptRevision: 'evaluation-prompt-v2', contractRevision: 'schema-draft-evaluation-v2' },
}
const evaluationBase = {
  draftRevision: 7, aggregateRevisionId: 'aggregate-1', projectionContentHash: 'projection-sha', aiProfileId: 'profile-1', aiProfileRevision: 2,
  promptRevision: 'evaluation-prompt-v2', contractRevision: 'schema-draft-evaluation-v2', retryOfRunId: null, totalDocuments: 2,
  succeededDocuments: 1, failedDocuments: 1, staleDocuments: 0, failureCategory: null, retryable: true,
  createdAt: '2026-07-15T10:00:00Z', startedAt: '2026-07-15T10:00:01Z', completedAt: '2026-07-15T10:01:00Z',
}
export const evaluationFixture: EvaluationRun = {
  ...evaluationBase, id: 'evaluation-partial', status: 'PARTIAL', metrics, advisoryAssessment,
  outcomes: { page: 0, size: 20, totalElements: 2, content: [
    { id: 'evaluation-outcome-1', documentId: 'held-out-1', documentSha256: 'held-out-sha', status: 'SUCCEEDED', reused: true, chunkCount: 4, metrics, evidenceCoordinates: ['nodes.Customer'], failureCategory: null, retryable: false, startedAt: '2026-07-15T10:00:01Z', completedAt: '2026-07-15T10:00:30Z' },
    { id: 'evaluation-outcome-2', documentId: 'held-out-2', documentSha256: 'held-out-2-sha', status: 'STALE_SOURCE', reused: false, chunkCount: 0, metrics: null, evidenceCoordinates: [], failureCategory: 'SOURCE_CHANGED', retryable: true, startedAt: null, completedAt: '2026-07-15T10:00:32Z' },
  ] },
}
export const activeEvaluationFixture: EvaluationRun = {
  ...evaluationBase, id: 'evaluation-running', status: 'RUNNING', totalDocuments: 2, succeededDocuments: 0, failedDocuments: 0,
  metrics: null, advisoryAssessment: null, startedAt: '2026-07-15T10:00:01Z', completedAt: null,
  outcomes: { page: 0, size: 20, totalElements: 2, content: [
    { id: 'evaluation-outcome-running', documentId: 'held-out-1', documentSha256: 'held-out-sha', status: 'RUNNING', reused: false, chunkCount: 0, metrics: null, evidenceCoordinates: [], failureCategory: null, retryable: true, startedAt: '2026-07-15T10:00:01Z', completedAt: null },
    { id: 'evaluation-outcome-queued', documentId: 'held-out-2', documentSha256: 'held-out-2-sha', status: 'QUEUED', reused: false, chunkCount: 0, metrics: null, evidenceCoordinates: [], failureCategory: null, retryable: true, startedAt: null, completedAt: null },
  ] },
}
export const interruptedEvaluationFixture: EvaluationRun = {
  ...evaluationBase, id: 'evaluation-interrupted', status: 'INTERRUPTED', totalDocuments: 2, succeededDocuments: 1, failedDocuments: 1,
  metrics: null, advisoryAssessment: null, failureCategory: 'APPLICATION_RESTART', retryable: true, completedAt: '2026-07-15T10:00:30Z',
  outcomes: { page: 0, size: 20, totalElements: 2, content: [
    { id: 'evaluation-outcome-reused', documentId: 'held-out-1', documentSha256: 'held-out-sha', status: 'REUSED', reused: true, chunkCount: 4, metrics, evidenceCoordinates: ['nodes.Customer'], failureCategory: null, retryable: false, startedAt: '2026-07-15T10:00:01Z', completedAt: '2026-07-15T10:00:20Z' },
    { id: 'evaluation-outcome-interrupted', documentId: 'held-out-2', documentSha256: 'held-out-2-sha', status: 'INTERRUPTED', reused: false, chunkCount: 0, metrics: null, evidenceCoordinates: [], failureCategory: 'APPLICATION_RESTART', retryable: true, startedAt: '2026-07-15T10:00:21Z', completedAt: '2026-07-15T10:00:30Z' },
  ] },
}
export const evaluationHistoryFixture: PageResponse<EvaluationRunSummary> = { page: 0, size: 20, totalElements: 3, content: [
  { ...evaluationBase, id: 'evaluation-partial', status: 'PARTIAL', current: true, statusLocation: '/evaluation-runs/evaluation-partial' },
  { ...evaluationBase, id: 'evaluation-failed', status: 'FAILED', current: false, succeededDocuments: 0, failedDocuments: 2, failureCategory: 'PROVIDER_ERROR', statusLocation: '/evaluation-runs/evaluation-failed' },
  { ...evaluationBase, id: 'evaluation-legacy', status: 'COMPLETED', current: false, contractRevision: 'schema-draft-evaluation-v1', retryable: false, statusLocation: '/evaluation-runs/evaluation-legacy' },
] }
export const readinessFixture: PublicationReadiness = { ready: true, draftRevision: 7, aggregateRevisionId: 'aggregate-1', projectionContentHash: 'projection-sha', targetName: 'Support', targetVersion: 2, blockingReasons: [] }
export const blockedReadinessFixture: PublicationReadiness = { ...readinessFixture, ready: false, blockingReasons: [{ id: 'evaluation-current', category: 'EVALUATION', detail: 'A current successful held-out evaluation is required.' }] }
export const publicationFixture: Publication = { publicationId: 'publication-1', draftId: 'draft-1', schemaId: 'schema-2', draftRevision: 7, publicationContentHash: 'projection-sha', currentSchemaContentHash: 'projection-sha', contentDrifted: false, active: false, publishedAt: '2026-07-15T11:00:00Z' }
export const planFixture: ReprocessingPlan = {
  id: 'plan-partial', reason: 'SCHEMA_ACTIVATION', selection: null, expectedChunkerRevision: null, status: 'PARTIAL', draftId: 'draft-1', knowledgeBaseId: 'kb-1', schemaId: 'schema-2', schemaContentHash: 'projection-sha', aiProfileId: 'profile-1', aiProfileRevision: 2, retryOfPlanId: null,
  totalDocuments: 3, queuedDocuments: 0, runningDocuments: 0, succeededDocuments: 1, failedDocuments: 0, staleDocuments: 1, blockedDocuments: 1,
  createdAt: '2026-07-15T12:00:00Z', startedAt: '2026-07-15T12:00:01Z', completedAt: '2026-07-15T12:02:00Z',
  items: { page: 0, size: 20, totalElements: 3, content: [
    { id: 'plan-item-1', documentId: 'document-1', documentSha256: 'sha-1', status: 'SUCCEEDED', failureCategory: null, retryable: false, priorItemId: null, startedAt: '2026-07-15T12:00:02Z', completedAt: '2026-07-15T12:00:20Z' },
    { id: 'plan-item-2', documentId: 'document-2', documentSha256: 'sha-2', status: 'STALE_SOURCE', failureCategory: 'SOURCE_CHANGED', retryable: true, priorItemId: null, startedAt: null, completedAt: '2026-07-15T12:00:21Z' },
    { id: 'plan-item-3', documentId: 'document-3', documentSha256: 'sha-3', status: 'BLOCKED', failureCategory: 'ACTIVE_SCHEMA_CHANGED', retryable: true, priorItemId: null, startedAt: null, completedAt: '2026-07-15T12:00:22Z' },
  ] },
}
export const planHistoryFixture: PageResponse<ReprocessingPlanSummary> = { page: 0, size: 20, totalElements: 2, content: [
  { id: 'plan-partial', reason: 'SCHEMA_ACTIVATION', selection: null, expectedChunkerRevision: null, status: 'PARTIAL', draftId: 'draft-1', schemaId: 'schema-2', schemaContentHash: 'projection-sha', retryOfPlanId: null, totalDocuments: 3, queuedDocuments: 0, runningDocuments: 0, succeededDocuments: 1, failedDocuments: 0, staleDocuments: 1, blockedDocuments: 1, latest: true, targetCurrent: true, retryable: true, createdAt: '2026-07-15T12:00:00Z', startedAt: '2026-07-15T12:00:01Z', completedAt: '2026-07-15T12:02:00Z', statusLocation: '/reprocessing-plans/plan-partial' },
  { id: 'plan-old', reason: 'SCHEMA_ACTIVATION', selection: null, expectedChunkerRevision: null, status: 'COMPLETED', draftId: 'draft-1', schemaId: 'schema-1', schemaContentHash: 'old-sha', retryOfPlanId: null, totalDocuments: 2, queuedDocuments: 0, runningDocuments: 0, succeededDocuments: 2, failedDocuments: 0, staleDocuments: 0, blockedDocuments: 0, latest: false, targetCurrent: false, retryable: false, createdAt: '2026-07-14T12:00:00Z', startedAt: '2026-07-14T12:00:01Z', completedAt: '2026-07-14T12:01:00Z', statusLocation: '/reprocessing-plans/plan-old' },
] }
