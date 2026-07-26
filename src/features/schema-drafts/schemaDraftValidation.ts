import { z } from 'zod'
import { ApiError } from '../../api/types'
import type {
  AnalysisRunResponse,
  AnalysisRunSummaryResponse,
  CandidateResponse,
  ConflictResponse,
  DecisionResponse,
  DiffResponse,
  DraftResponse,
  PageResponse,
  ProjectionResponse,
  SourceResponse,
  StartAnalysisResponse,
} from './schemaDraftTypes'

const nullableString = z.string().nullable()
const page = <T extends z.ZodType>(item: T) => z.object({
  page: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(),
  content: z.array(item),
}).strict()

const guidance = z.object({
  additionalInstructions: nullableString,
  guidance: z.object({
    domainDescription: nullableString,
    intendedQuestions: z.array(z.string()),
    requiredConcepts: z.array(z.object({ name: z.string(), description: nullableString, identityKeys: z.array(z.string()) }).strict()),
    preferredConcepts: z.array(z.object({ name: z.string(), description: nullableString, identityKeys: z.array(z.string()) }).strict()),
    excludedConcepts: z.array(z.string()),
    namingRules: z.object({ nodeLabels: nullableString, relationshipTypes: nullableString, properties: nullableString }).strict().nullable(),
    propertyRules: z.array(z.object({ owner: z.string(), name: z.string(), type: z.string(), identity: z.boolean().nullable(), required: z.boolean().nullable() }).strict()),
    relationshipRules: z.array(z.object({ type: z.string(), from: z.string(), to: z.string(), cardinality: nullableString }).strict()),
  }).strict(),
}).strict()

const analysisReference = z.object({ id: z.string(), status: z.string(), current: z.boolean(), statusLocation: z.string() }).strict()
const draft = z.object({
  id: z.string(), knowledgeBaseId: z.string(), targetName: z.string(), targetVersion: z.number().int(), baseSchemaId: nullableString,
  status: z.string(), revision: z.number().int(), guidance, guidanceRevision: z.number().int(), guidanceFingerprint: z.string(),
  currentAggregateId: nullableString, publicationSchemaId: nullableString, publicationContentHash: nullableString,
  currentPublishedSchemaContentHash: nullableString, publicationContentDrifted: z.boolean(), activeAiProfileId: nullableString,
  activeAiProfileRevision: z.number().int(), currentAnalysis: analysisReference.nullable(),
  latestEvaluation: z.object({ id: z.string(), status: z.string(), current: z.boolean(), latest: z.boolean(), statusLocation: z.string() }).strict().nullable(),
  latestReprocessing: z.object({ id: z.string(), status: z.string(), targetCurrent: z.boolean(), latest: z.boolean(), statusLocation: z.string() }).strict().nullable(),
  createdAt: z.string(), updatedAt: z.string(),
}).strict()

const source = z.object({
  id: z.string(), type: z.string(), status: z.string(), revision: z.number().int(), documentId: nullableString,
  name: nullableString, contentType: nullableString, sizeBytes: z.number().int(), sha256: z.string(), analyzed: z.boolean(),
  createdAt: z.string(), updatedAt: z.string(),
}).strict()
const outcome = z.object({
  id: z.string(), sourceId: z.string(), sourceRevision: z.number().int(), status: z.string(), reused: z.boolean(),
  failureCategory: nullableString, failureCode: nullableString, retryable: z.boolean(), chunkCount: z.number().int(), completedAt: nullableString,
}).strict()
const run = z.object({
  id: z.string(), status: z.string(), draftRevision: z.number().int(), guidanceRevision: z.number().int(), aiProfileId: z.string(),
  aiProfileRevision: z.number().int(), promptRevision: z.string(), candidateRevision: z.string(), totalSources: z.number().int(),
  succeededSources: z.number().int(), failedSources: z.number().int(), effectiveSourceConcurrency: z.number().int().nullable(),
  effectiveSourceTimeoutMillis: z.number().int().nullable(), effectiveRequestTimeoutMillis: z.number().int().nullable(),
  currentResult: z.boolean(), aggregateRevisionId: nullableString,
  failureCategory: nullableString, retryable: z.boolean(), canRetry: z.boolean(), retryOfRunId: nullableString, createdAt: z.string(), startedAt: nullableString,
  completedAt: nullableString, sourceOutcomes: page(outcome),
}).strict()
const runSummary = z.object({
  id: z.string(), status: z.string(), draftRevision: z.number().int(), guidanceRevision: z.number().int(), totalSources: z.number().int(),
  succeededSources: z.number().int(), failedSources: z.number().int(), effectiveSourceConcurrency: z.number().int().nullable(),
  effectiveSourceTimeoutMillis: z.number().int().nullable(), effectiveRequestTimeoutMillis: z.number().int().nullable(),
  current: z.boolean(), aggregateRevisionId: nullableString,
  failureCategory: nullableString, retryable: z.boolean(), canRetry: z.boolean(), retryOfRunId: nullableString, createdAt: z.string(), startedAt: nullableString,
  completedAt: nullableString, statusLocation: z.string(),
}).strict()
const evidence = z.object({ sourceId: z.string(), sourceFingerprint: z.string(), chunkId: nullableString, documentId: nullableString, origins: z.array(z.string()) }).strict()
const candidate = z.object({
  kind: z.string(), identity: z.string(), label: nullableString, property: nullableString, propertyType: nullableString, keys: z.array(z.string()),
  relationshipType: nullableString, fromLabel: nullableString, toLabel: nullableString, originalLabel: nullableString,
  originalProperty: nullableString, originalRelationshipType: nullableString, confidence: z.number().nullable(), origins: z.array(z.string()),
  evidence: z.array(evidence), supportCount: z.number().int(), recommendationState: z.string(), effectiveReviewState: nullableString, latestDecisionId: nullableString,
}).strict()
const decision = z.object({
  id: z.string(), sequence: z.number().int(), draftRevision: z.number().int(), type: z.string(), reviewState: z.string(),
  candidateIdentity: z.string(), priorValue: z.unknown(), resultingValue: z.unknown(), rationale: nullableString, createdAt: z.string(),
}).strict()
const conflict = z.object({
  id: z.string(), type: z.string(), coordinate: z.string(), alternatives: z.unknown(), evidence: z.unknown(), resolved: z.boolean(),
  selectedAlternative: nullableString, customResolution: z.unknown(), aggregateRevisionId: z.string(), current: z.boolean(),
  createdAt: z.string(), resolvedAt: nullableString,
}).strict()
const projection = z.object({ aggregateRevisionId: z.string(), draftRevision: z.number().int(), schema: z.unknown(), publicationReady: z.boolean() }).strict()
const diffBaseline = z.object({
  type: z.enum(['BASE_SCHEMA', 'PREVIOUS_AGGREGATE', 'EMPTY']),
  id: nullableString,
  contentHash: z.string(),
}).strict()
const diff = z.object({
  aggregateRevisionId: z.string(),
  draftRevision: z.number().int().optional(),
  baseline: diffBaseline.optional(),
  changes: z.array(z.object({ coordinate: z.string(), compatibility: z.string(), operation: z.string(), before: z.unknown(), after: z.unknown() }).strict()),
}).strict()

function parse<T>(schema: z.ZodType, value: unknown, resource: string): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError({ status: 200, message: `${resource} response has unexpected shape`, details: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) })
  return result.data as T
}

export const schemaDraftValidation = {
  draft: (value: unknown) => parse<DraftResponse>(draft, value, 'Schema draft'),
  drafts: (value: unknown) => parse<DraftResponse[]>(z.array(draft), value, 'Schema draft list'),
  source: (value: unknown) => parse<SourceResponse>(source, value, 'Schema draft source'),
  sources: (value: unknown) => parse<SourceResponse[]>(z.array(source), value, 'Schema draft source list'),
  startAnalysis: (value: unknown) => parse<StartAnalysisResponse>(z.object({ runId: z.string(), status: z.string(), statusLocation: z.string() }).strict(), value, 'Analysis start'),
  run: (value: unknown) => parse<AnalysisRunResponse>(run, value, 'Analysis run'),
  runs: (value: unknown) => parse<PageResponse<AnalysisRunSummaryResponse>>(page(runSummary), value, 'Analysis history'),
  candidates: (value: unknown) => parse<PageResponse<CandidateResponse>>(page(candidate), value, 'Candidate page'),
  decision: (value: unknown) => parse<DecisionResponse>(decision, value, 'Decision'),
  decisions: (value: unknown) => parse<DecisionResponse[]>(z.array(decision), value, 'Decision history'),
  conflict: (value: unknown) => parse<ConflictResponse>(conflict, value, 'Conflict'),
  conflicts: (value: unknown) => parse<ConflictResponse[]>(z.array(conflict), value, 'Conflict list'),
  projection: (value: unknown) => parse<ProjectionResponse>(projection, value, 'Projection'),
  diff: (value: unknown) => parse<DiffResponse>(diff, value, 'Compatibility diff'),
}
