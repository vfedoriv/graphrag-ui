import { z } from 'zod'
import { ApiError } from '../../api/types'
import type { PageResponse } from './schemaDraftTypes'
import type {
  EligibilityPage, EvaluationRun, EvaluationRunSummary, Publication,
  PublicationReadiness, ReprocessingPlan, ReprocessingPlanSummary, StartEvaluationResponse, StartPlanResponse,
} from './schemaDraftReleaseTypes'

const nullableString = z.string().nullable()
const page = <T extends z.ZodType>(item: T) => z.object({
  page: z.number().int().nonnegative(), size: z.number().int().nonnegative(), totalElements: z.number().int().nonnegative(), content: z.array(item),
}).strict()
const reason = z.object({ code: z.string(), detail: z.string() }).strict()
const evidence = z.object({ coordinate: z.string() }).strict()
const metrics = z.object({
  rates: z.array(z.object({ metric: z.string(), numerator: z.number().int(), denominator: z.number().int(), value: z.number().nullable(), applicability: z.string(), evidence: z.array(evidence) }).strict()),
  counts: z.array(z.object({ metric: z.string(), count: z.number().int(), evidence: z.array(evidence) }).strict()),
  reasons: z.array(reason),
}).strict()
const advisory = z.object({
  status: z.string(),
  intendedQuestions: z.array(z.object({ questionFingerprint: z.string(), coverage: z.string(), reasons: z.array(reason), schemaCoordinates: z.array(z.string()) }).strict()),
  schemaNoise: z.array(z.object({ schemaCoordinate: z.string(), assessment: z.string(), reasons: z.array(reason) }).strict()),
  reasons: z.array(reason), warnings: z.array(z.string()),
  reproducibility: z.object({ profileId: z.string(), profileRevision: z.number().int(), promptRevision: z.string(), contractRevision: z.string() }).strict(),
}).strict()
const evaluationOutcome = z.object({
  id: z.string(), documentId: z.string(), documentSha256: z.string(), status: z.string(), reused: z.boolean(), chunkCount: z.number().int(),
  metrics: metrics.nullable(), evidenceCoordinates: z.array(z.string()), failureCategory: nullableString, retryable: z.boolean(), startedAt: nullableString, completedAt: nullableString,
}).strict()
const evaluationBase = {
  id: z.string(), status: z.string(), draftRevision: z.number().int(), aggregateRevisionId: z.string(), projectionContentHash: z.string(),
  aiProfileId: z.string(), aiProfileRevision: z.number().int(), promptRevision: z.string(), contractRevision: z.string(), retryOfRunId: nullableString,
  totalDocuments: z.number().int(), succeededDocuments: z.number().int(), failedDocuments: z.number().int(), staleDocuments: z.number().int(),
  failureCategory: nullableString, retryable: z.boolean(), createdAt: z.string(), startedAt: nullableString, completedAt: nullableString,
}
const evaluationRun = z.object({ ...evaluationBase, metrics, advisoryAssessment: advisory, outcomes: page(evaluationOutcome) }).strict()
const evaluationSummary = z.object({ ...evaluationBase, current: z.boolean(), statusLocation: z.string() }).strict()
const eligibleDocument = z.object({
  documentId: z.string(), filename: z.string(), contentType: z.string(), sizeBytes: z.number().int(), sha256: z.string(), uploadedAt: z.string(),
  eligible: z.boolean(), ineligibilityReason: nullableString,
}).strict()
const eligibility = page(eligibleDocument).extend({ draftRevision: z.number().int(), currentAggregateId: nullableString }).strict()
const readiness = z.object({
  ready: z.boolean(), draftRevision: z.number().int(), aggregateRevisionId: z.string(), projectionContentHash: z.string(),
  targetName: z.string(), targetVersion: z.number().int(), blockingReasons: z.array(z.object({ id: z.string(), category: z.string(), detail: z.string() }).strict()),
}).strict()
const publication = z.object({
  publicationId: z.string(), draftId: z.string(), schemaId: z.string(), draftRevision: z.number().int(), publicationContentHash: z.string(),
  currentSchemaContentHash: z.string(), contentDrifted: z.boolean(), active: z.boolean(), publishedAt: z.string(),
}).strict()
const planItem = z.object({
  id: z.string(), documentId: z.string(), documentSha256: z.string(), status: z.string(), failureCategory: nullableString,
  retryable: z.boolean(), priorItemId: nullableString, startedAt: nullableString, completedAt: nullableString,
}).strict()
const planBase = {
  id: z.string(), status: z.string(), draftId: z.string(), schemaId: z.string(), schemaContentHash: z.string(), retryOfPlanId: nullableString,
  totalDocuments: z.number().int(), queuedDocuments: z.number().int(), runningDocuments: z.number().int(), succeededDocuments: z.number().int(),
  failedDocuments: z.number().int(), staleDocuments: z.number().int(), blockedDocuments: z.number().int(),
  createdAt: z.string(), startedAt: nullableString, completedAt: nullableString,
}
const plan = z.object({ ...planBase, knowledgeBaseId: z.string(), aiProfileId: z.string(), aiProfileRevision: z.number().int(), items: page(planItem) }).strict()
const planSummary = z.object({ ...planBase, latest: z.boolean(), targetCurrent: z.boolean(), retryable: z.boolean(), statusLocation: z.string() }).strict()

function parse<T>(schema: z.ZodType, value: unknown, resource: string): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError({ status: 200, message: `${resource} response has unexpected shape`, details: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) })
  return result.data as T
}

export const schemaDraftReleaseValidation = {
  eligibility: (value: unknown) => parse<EligibilityPage>(eligibility, value, 'Evaluation eligibility'),
  startEvaluation: (value: unknown) => parse<StartEvaluationResponse>(z.object({ runId: z.string(), status: z.string(), statusLocation: z.string() }).strict(), value, 'Evaluation start'),
  evaluation: (value: unknown) => parse<EvaluationRun>(evaluationRun, value, 'Evaluation run'),
  evaluations: (value: unknown) => parse<PageResponse<EvaluationRunSummary>>(page(evaluationSummary), value, 'Evaluation history'),
  readiness: (value: unknown) => parse<PublicationReadiness>(readiness, value, 'Publication readiness'),
  publication: (value: unknown) => parse<Publication>(publication, value, 'Publication'),
  startPlan: (value: unknown) => parse<StartPlanResponse>(z.object({ planId: z.string(), status: z.string(), statusLocation: z.string() }).strict(), value, 'Reprocessing plan start'),
  plan: (value: unknown) => parse<ReprocessingPlan>(plan, value, 'Reprocessing plan'),
  plans: (value: unknown) => parse<PageResponse<ReprocessingPlanSummary>>(page(planSummary), value, 'Reprocessing plan history'),
}
