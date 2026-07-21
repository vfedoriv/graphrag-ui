import type { DocumentProcessingOptionValue } from '../../api/types'
import type { PageResponse } from './schemaDraftTypes'

export type EvaluationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'INTERRUPTED'
export type EvaluationOutcomeStatus = 'SUCCEEDED' | 'FAILED' | 'STALE_SOURCE' | 'INTERRUPTED'
export type MetricApplicability = 'APPLICABLE' | 'NOT_APPLICABLE'
export type MetricIdentifier =
  | 'RECOGNIZED_ENTITY_RATE' | 'DROPPED_RELATIONSHIP_RATE' | 'KEY_AVAILABILITY_RATE'
  | 'RECOGNIZED_ENTITIES' | 'UNKNOWN_ENTITIES' | 'RELATIONSHIPS' | 'DROPPED_RELATIONSHIPS'
  | 'NODES_REQUIRING_KEYS' | 'NODES_WITH_KEYS' | 'PROPERTY_TYPE_CONFLICTS'
  | 'MISSING_REQUIRED_PROPERTIES' | 'LOW_SUPPORT_CANDIDATES' | 'GUIDED_WITHOUT_EVIDENCE_CANDIDATES'
export type AdvisoryExecutionStatus = 'NOT_REQUESTED' | 'COMPLETED' | 'COMPLETED_WITHOUT_MODEL_JUDGMENT' | 'FAILED'
export type QuestionCoverage = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'UNASSESSED'
export type EvaluationReadiness = 'READY' | 'NOT_READY'
export type EvaluationIneligibilityReason = 'ACTIVE_DISCOVERY_EVIDENCE' | 'DRAFT_ANALYSIS_REQUIRED'

export type MetricEvidence = { coordinate: string }
export type RateMetric = { metric: MetricIdentifier; numerator: number; denominator: number; value: number | null; applicability: MetricApplicability; evidence: MetricEvidence[] }
export type CountMetric = { metric: MetricIdentifier; count: number; evidence: MetricEvidence[] }
export type EvaluationReason = { code: string; detail: string }
export type EvaluationMetrics = { rates: RateMetric[]; counts: CountMetric[]; reasons: EvaluationReason[] }
export type AdvisoryReason = { code: string; detail: string }
export type QuestionAssessment = { questionFingerprint: string; coverage: QuestionCoverage; reasons: AdvisoryReason[]; schemaCoordinates: string[] }
export type CoordinateAssessment = { schemaCoordinate: string; assessment: string; reasons: AdvisoryReason[] }
export type EvaluationReproducibility = { profileId: string; profileRevision: number; promptRevision: string; contractRevision: string }
export type AdvisoryAssessment = {
  status: AdvisoryExecutionStatus
  intendedQuestions: QuestionAssessment[]
  schemaNoise: CoordinateAssessment[]
  reasons: AdvisoryReason[]
  warnings: string[]
  reproducibility: EvaluationReproducibility
}

export type EligibleDocument = {
  documentId: string; filename: string; contentType: string; sizeBytes: number; sha256: string; uploadedAt: string
  eligible: boolean; ineligibilityReason: EvaluationIneligibilityReason | null
}
export type EligibilityPage = PageResponse<EligibleDocument> & {
  draftRevision: number
  currentAggregateId: string | null
  readiness: EvaluationReadiness
  blockingReason: EvaluationIneligibilityReason | null
}
export type StartEvaluationRequest = { revision: number; documentIds: string[]; advisoryEnabled: boolean }
export type StartEvaluationResponse = { runId: string; status: EvaluationStatus; statusLocation: string }
export type EvaluationOutcome = {
  id: string; documentId: string; documentSha256: string; status: EvaluationOutcomeStatus; reused: boolean; chunkCount: number
  metrics: EvaluationMetrics | null; evidenceCoordinates: string[]; failureCategory: string | null; retryable: boolean
  startedAt: string | null; completedAt: string | null
}
export type EvaluationRun = {
  id: string; status: EvaluationStatus; draftRevision: number; aggregateRevisionId: string; projectionContentHash: string
  aiProfileId: string; aiProfileRevision: number; promptRevision: string; contractRevision: string; retryOfRunId: string | null
  totalDocuments: number; succeededDocuments: number; failedDocuments: number; staleDocuments: number
  metrics: EvaluationMetrics; advisoryAssessment: AdvisoryAssessment; failureCategory: string | null; retryable: boolean
  createdAt: string; startedAt: string | null; completedAt: string | null; outcomes: PageResponse<EvaluationOutcome>
}
export type EvaluationRunSummary = Omit<EvaluationRun, 'metrics' | 'advisoryAssessment' | 'outcomes'> & { current: boolean; statusLocation: string }

export type ReadinessBlockingReason = { id: string; category: string; detail: string }
export type PublicationReadiness = {
  ready: boolean; draftRevision: number; aggregateRevisionId: string; projectionContentHash: string
  targetName: string; targetVersion: number; blockingReasons: ReadinessBlockingReason[]
}
export type PublishDraftRequest = { revision: number; projectionContentHash: string }
export type Publication = {
  publicationId: string; draftId: string; schemaId: string; draftRevision: number; publicationContentHash: string
  currentSchemaContentHash: string; contentDrifted: boolean; active: boolean; publishedAt: string
}

export type ReprocessingPlanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'INTERRUPTED'
export type ReprocessingItemStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STALE_SOURCE' | 'BLOCKED' | 'INTERRUPTED' | 'SKIPPED'
export type CreatePlanRequest = {
  draftId: string; schemaId: string; allDocuments: boolean; documentIds: string[] | null
  processingOptions: Record<string, DocumentProcessingOptionValue> | null
}
export type RetryPlanRequest = { resnapshotUnresolvedDocuments: boolean }
export type StartPlanResponse = { planId: string; status: ReprocessingPlanStatus; statusLocation: string }
export type PlanItem = {
  id: string; documentId: string; documentSha256: string; status: ReprocessingItemStatus; failureCategory: string | null
  retryable: boolean; priorItemId: string | null; startedAt: string | null; completedAt: string | null
}
export type ReprocessingPlan = {
  id: string; status: ReprocessingPlanStatus; draftId: string; knowledgeBaseId: string; schemaId: string; schemaContentHash: string
  aiProfileId: string; aiProfileRevision: number; retryOfPlanId: string | null; totalDocuments: number; queuedDocuments: number
  runningDocuments: number; succeededDocuments: number; failedDocuments: number; staleDocuments: number; blockedDocuments: number
  createdAt: string; startedAt: string | null; completedAt: string | null; items: PageResponse<PlanItem>
}
export type ReprocessingPlanSummary = Omit<ReprocessingPlan, 'knowledgeBaseId' | 'aiProfileId' | 'aiProfileRevision' | 'items'> & {
  latest: boolean; targetCurrent: boolean; retryable: boolean; statusLocation: string
}

export const isEvaluationTerminal = (status: EvaluationStatus) => ['COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].includes(status)
export const isPlanTerminal = (status: ReprocessingPlanStatus) => ['COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].includes(status)
