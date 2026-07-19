import type {
  CandidateKind,
  CandidateResponse,
  EvidenceOrigin,
  RecommendationState,
  ReviewState,
} from './schemaDraftTypes'

export type CandidateReviewFilter = 'ALL' | 'UNREVIEWED' | Exclude<ReviewState, 'PENDING'>

export type CandidateFilters = {
  text: string
  kind: 'ALL' | CandidateKind
  recommendation: 'ALL' | RecommendationState
  reviewState: CandidateReviewFilter
  origin: 'ALL' | EvidenceOrigin
}

export const defaultCandidateFilters: CandidateFilters = {
  text: '',
  kind: 'ALL',
  recommendation: 'ALL',
  reviewState: 'ALL',
  origin: 'ALL',
}

const normalizedReviewState = (candidate: CandidateResponse): CandidateReviewFilter =>
  candidate.effectiveReviewState === null || candidate.effectiveReviewState === 'PENDING'
    ? 'UNREVIEWED'
    : candidate.effectiveReviewState

const searchableCandidateText = (candidate: CandidateResponse) => [
  candidate.identity,
  candidate.label,
  candidate.property,
  candidate.propertyType,
  ...candidate.keys,
  candidate.relationshipType,
  candidate.fromLabel,
  candidate.toLabel,
  candidate.originalLabel,
  candidate.originalProperty,
  candidate.originalRelationshipType,
].filter((value): value is string => Boolean(value)).join(' ').toLocaleLowerCase()

export function filterCandidates(candidates: CandidateResponse[], filters: CandidateFilters) {
  const text = filters.text.trim().toLocaleLowerCase()

  return candidates.filter((candidate) =>
    (!text || searchableCandidateText(candidate).includes(text))
    && (filters.kind === 'ALL' || candidate.kind === filters.kind)
    && (filters.recommendation === 'ALL' || candidate.recommendationState === filters.recommendation)
    && (filters.reviewState === 'ALL' || normalizedReviewState(candidate) === filters.reviewState)
    && (filters.origin === 'ALL' || candidate.origins.includes(filters.origin)))
}
