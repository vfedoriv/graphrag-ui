import type { CandidateResponse, RecommendationState } from './schemaDraftTypes'

const recommendationRank: Record<RecommendationState, number> = {
  RECOMMENDED: 0,
  REVIEW_REQUIRED: 1,
  LOW_SUPPORT: 2,
  SUPPRESSED: 3,
}

const nodeChildKindRank = {
  NODE_KEY: 0,
  NODE_PROPERTY: 1,
} as const

const normalize = (value: string | null) => value?.normalize('NFKC').trim().toLowerCase() ?? ''

const compareText = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0

function compareConfidence(left: number | null, right: number | null) {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  return right - left
}

function compareStrength(left: CandidateResponse, right: CandidateResponse) {
  return compareConfidence(left.confidence, right.confidence)
    || right.supportCount - left.supportCount
}

const compareIdentity = (left: CandidateResponse, right: CandidateResponse) => compareText(left.identity, right.identity)

function nodeCoordinate(candidate: CandidateResponse) {
  return normalize(candidate.label)
}

function nodeChildCoordinate(candidate: CandidateResponse) {
  if (candidate.kind === 'NODE_KEY') return candidate.keys.map((key) => normalize(key)).join('\u0000')
  return normalize(candidate.property)
}

function relationshipCoordinate(candidate: CandidateResponse) {
  return [normalize(candidate.fromLabel), normalize(candidate.relationshipType), normalize(candidate.toLabel)].join('\u0000')
}

function relationshipKey(candidate: CandidateResponse) {
  const parts = [normalize(candidate.fromLabel), normalize(candidate.relationshipType), normalize(candidate.toLabel)]
  return parts.every(Boolean) ? parts.join('\u0000') : null
}

function compareNodes(left: CandidateResponse, right: CandidateResponse) {
  return compareStrength(left, right)
    || compareText(nodeCoordinate(left), nodeCoordinate(right))
    || compareIdentity(left, right)
}

function compareNodeChildren(left: CandidateResponse, right: CandidateResponse) {
  const leftKind = left.kind === 'NODE_KEY' || left.kind === 'NODE_PROPERTY' ? nodeChildKindRank[left.kind] : 2
  const rightKind = right.kind === 'NODE_KEY' || right.kind === 'NODE_PROPERTY' ? nodeChildKindRank[right.kind] : 2
  return compareStrength(left, right)
    || leftKind - rightKind
    || compareText(nodeChildCoordinate(left), nodeChildCoordinate(right))
    || compareIdentity(left, right)
}

function compareRelationships(left: CandidateResponse, right: CandidateResponse) {
  return recommendationRank[left.recommendationState] - recommendationRank[right.recommendationState]
    || compareStrength(left, right)
    || compareText(relationshipCoordinate(left), relationshipCoordinate(right))
    || compareIdentity(left, right)
}

function compareRelationshipProperties(left: CandidateResponse, right: CandidateResponse) {
  return compareStrength(left, right)
    || compareText(normalize(left.property), normalize(right.property))
    || compareIdentity(left, right)
}

function groupedNodeChildren(candidates: CandidateResponse[]) {
  const groups = new Map<string, CandidateResponse[]>()
  for (const candidate of candidates) {
    const coordinate = nodeCoordinate(candidate) || candidate.identity
    groups.set(coordinate, [...(groups.get(coordinate) ?? []), candidate])
  }
  return [...groups.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .flatMap(([, children]) => children.sort(compareNodeChildren))
}

export function organizeCandidates(candidates: CandidateResponse[]) {
  const nodes = candidates.filter((candidate) => candidate.kind === 'NODE').sort(compareNodes)
  const nodeChildren = candidates.filter((candidate) => candidate.kind === 'NODE_PROPERTY' || candidate.kind === 'NODE_KEY')
  const nodeChildrenByParent = new Map<string, CandidateResponse[]>()
  const unmatchedNodeChildren: CandidateResponse[] = []
  const nodeKeys = new Set(nodes.map(nodeCoordinate).filter(Boolean))

  for (const candidate of nodeChildren) {
    const key = nodeCoordinate(candidate)
    if (!key || !nodeKeys.has(key)) unmatchedNodeChildren.push(candidate)
    else nodeChildrenByParent.set(key, [...(nodeChildrenByParent.get(key) ?? []), candidate])
  }

  const relationships = candidates.filter((candidate) => candidate.kind === 'RELATIONSHIP').sort(compareRelationships)
  const relationshipProperties = candidates.filter((candidate) => candidate.kind === 'RELATIONSHIP_PROPERTY')
  const relationshipPropertiesByParent = new Map<string, CandidateResponse[]>()
  const unmatchedRelationshipProperties: CandidateResponse[] = []
  const relationshipKeys = new Set(relationships.map(relationshipKey).filter((key): key is string => key !== null))

  for (const candidate of relationshipProperties) {
    const key = relationshipKey(candidate)
    if (!key || !relationshipKeys.has(key)) unmatchedRelationshipProperties.push(candidate)
    else relationshipPropertiesByParent.set(key, [...(relationshipPropertiesByParent.get(key) ?? []), candidate])
  }

  const attachedNodeKeys = new Set<string>()
  const organizedNodes = nodes.flatMap((node) => {
    const key = nodeCoordinate(node)
    if (attachedNodeKeys.has(key)) return [node]
    attachedNodeKeys.add(key)
    return [node, ...(nodeChildrenByParent.get(key) ?? []).sort(compareNodeChildren)]
  })
  const attachedRelationshipKeys = new Set<string>()
  const organizedRelationships = relationships.flatMap((relationship) => {
    const key = relationshipKey(relationship)
    if (!key || attachedRelationshipKeys.has(key)) return [relationship]
    attachedRelationshipKeys.add(key)
    return [relationship, ...(relationshipPropertiesByParent.get(key) ?? []).sort(compareRelationshipProperties)]
  })

  return [
    ...organizedNodes,
    ...groupedNodeChildren(unmatchedNodeChildren),
    ...organizedRelationships,
    ...unmatchedRelationshipProperties.sort(compareRelationshipProperties),
  ]
}
