import type { CandidateKind, CandidateResponse, RecommendationState, ReviewState } from './schemaDraftTypes'

export const candidateKindLabel = (kind: CandidateKind) => ({
  NODE: 'Node',
  NODE_PROPERTY: 'Node property',
  NODE_KEY: 'Node key',
  RELATIONSHIP: 'Relationship',
  RELATIONSHIP_PROPERTY: 'Relationship property',
})[kind]

const value = (candidateValue: string | null, fallback: string) => candidateValue || fallback

export function candidateTitle(candidate: CandidateResponse) {
  switch (candidate.kind) {
    case 'NODE': return value(candidate.label, 'Unnamed node')
    case 'NODE_PROPERTY': return `${value(candidate.label, 'Unnamed node')}.${value(candidate.property, 'unnamed property')}`
    case 'NODE_KEY': return `${value(candidate.label, 'Unnamed node')} key: ${candidate.keys.length ? candidate.keys.join(', ') : 'none specified'}`
    case 'RELATIONSHIP': return `${value(candidate.fromLabel, 'Unknown')} —[${value(candidate.relationshipType, 'UNNAMED')}]→ ${value(candidate.toLabel, 'Unknown')}`
    case 'RELATIONSHIP_PROPERTY': return `${value(candidate.relationshipType, 'UNNAMED')}.${value(candidate.property, 'unnamed property')}`
  }
}

export const candidateSupportingValue = (candidate: CandidateResponse) => {
  if (candidate.kind === 'NODE_PROPERTY' || candidate.kind === 'RELATIONSHIP_PROPERTY') return candidate.propertyType || 'Type not specified'
  if (candidate.kind === 'NODE_KEY') return 'Identity key'
  return candidate.kind === 'NODE' ? 'Node' : 'Relationship'
}

export const candidateEndpoints = (candidate: CandidateResponse) => candidate.kind === 'RELATIONSHIP' || candidate.kind === 'RELATIONSHIP_PROPERTY'
  ? `${value(candidate.fromLabel, 'Unknown')} → ${value(candidate.toLabel, 'Unknown')}`
  : null

export function candidateChanges(candidate: CandidateResponse) {
  const changes: string[] = []
  if (candidate.originalLabel && candidate.label && candidate.originalLabel !== candidate.label) changes.push(`Label: ${candidate.originalLabel} → ${candidate.label}`)
  if (candidate.originalProperty && candidate.property && candidate.originalProperty !== candidate.property) changes.push(`Property: ${candidate.originalProperty} → ${candidate.property}`)
  if (candidate.originalRelationshipType && candidate.relationshipType && candidate.originalRelationshipType !== candidate.relationshipType) changes.push(`Relationship type: ${candidate.originalRelationshipType} → ${candidate.relationshipType}`)
  return changes
}

export const formatSupport = (supportCount: number) => supportCount === 0
  ? 'No observed source support'
  : `Supported by ${supportCount} independent ${supportCount === 1 ? 'source' : 'sources'}`

export const formatConfidence = (confidence: number | null) => confidence === null ? 'Not provided' : `${Math.round(confidence * 100)}%`

export const recommendationLabel = (state: RecommendationState) => ({
  RECOMMENDED: 'Recommended',
  LOW_SUPPORT: 'Low support',
  REVIEW_REQUIRED: 'Review required',
  SUPPRESSED: 'Suppressed',
})[state]

export const reviewStateLabel = (state: ReviewState | null) => state === null || state === 'PENDING'
  ? 'Unreviewed'
  : ({ ACCEPTED: 'Accepted', REJECTED: 'Rejected', MODIFIED: 'Modified', PINNED: 'Pinned' } as const)[state]
