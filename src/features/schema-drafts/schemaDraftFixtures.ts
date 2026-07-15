import type { AnalysisRunResponse, AnalysisRunSummaryResponse, CandidateResponse, DraftResponse, PageResponse } from './schemaDraftTypes'
import { emptyDraftGuidance } from './schemaDraftTypes'

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
  aggregateRevisionId: 'aggregate-1', failureCategory: null, retryable: false, retryOfRunId: null,
  createdAt: '2026-07-15T08:00:00Z', startedAt: '2026-07-15T08:00:01Z', completedAt: '2026-07-15T08:01:00Z',
}
export const analysisHistoryFixture: PageResponse<AnalysisRunSummaryResponse> = {
  page: 0, size: 20, totalElements: 4, content: [
    { ...runBase, id: 'run-running', status: 'RUNNING', current: true, succeededSources: 1, failedSources: 0, aggregateRevisionId: null, completedAt: null, statusLocation: '/runs/run-running' },
    { ...runBase, id: 'run-partial', status: 'PARTIAL', current: true, retryable: true, statusLocation: '/runs/run-partial' },
    { ...runBase, id: 'run-failed', status: 'FAILED', current: false, succeededSources: 0, failedSources: 3, aggregateRevisionId: null, failureCategory: 'PROVIDER_ERROR', retryable: true, statusLocation: '/runs/run-failed' },
    { ...runBase, id: 'run-retry', status: 'COMPLETED', current: false, succeededSources: 3, failedSources: 0, retryOfRunId: 'run-partial', statusLocation: '/runs/run-retry' },
  ],
}
export const analysisDetailFixture: AnalysisRunResponse = {
  ...runBase, id: 'run-partial', status: 'PARTIAL', aiProfileId: 'profile-1', aiProfileRevision: 2,
  promptRevision: 'prompt-v1', candidateRevision: 'candidate-v1', currentResult: true, retryable: true,
  sourceOutcomes: { page: 0, size: 20, totalElements: 3, content: [
    { id: 'outcome-1', sourceId: 'source-1', sourceRevision: 1, status: 'SUCCEEDED', reused: true, failureCategory: null, retryable: false, chunkCount: 8, completedAt: '2026-07-15T08:00:30Z' },
    { id: 'outcome-2', sourceId: 'source-2', sourceRevision: 1, status: 'FAILED', reused: false, failureCategory: 'TIMEOUT', retryable: true, chunkCount: 0, completedAt: '2026-07-15T08:00:45Z' },
  ] },
}

export const candidateFixture: CandidateResponse = {
  kind: 'NODE_PROPERTY', identity: 'node-property:Customer:customerId', label: 'Customer', property: 'customerId', propertyType: 'STRING', keys: [],
  relationshipType: null, fromLabel: null, toLabel: null, originalLabel: null, originalProperty: null, originalRelationshipType: null,
  confidence: 0.97, origins: ['OBSERVED', 'GUIDED'], supportCount: 4, recommendationState: 'RECOMMENDED', effectiveReviewState: 'PINNED', latestDecisionId: 'decision-4',
  evidence: [{ sourceId: 'source-1', sourceFingerprint: 'source-sha', chunkId: 'chunk-2', documentId: 'document-1', origins: ['OBSERVED'] }],
}
export const candidatePageFixture: PageResponse<CandidateResponse> = { page: 0, size: 50, totalElements: 1, content: [candidateFixture] }

export const validationProblemFixture = {
  type: 'about:blank', title: 'Validation failed', status: 400, detail: 'Draft guidance is invalid',
  errors: { 'guidance.guidance.requiredConcepts[0].name': ['must not be blank'] },
}
