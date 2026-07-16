import { describe, expect, it } from 'vitest'
import type { CandidateKind, CandidateResponse } from './schemaDraftTypes'
import { organizeCandidates } from './organizeCandidates'

const candidate = (kind: CandidateKind, identity: string, overrides: Partial<CandidateResponse> = {}): CandidateResponse => ({
  kind,
  identity,
  label: null,
  property: null,
  propertyType: null,
  keys: [],
  relationshipType: null,
  fromLabel: null,
  toLabel: null,
  originalLabel: null,
  originalProperty: null,
  originalRelationshipType: null,
  confidence: 0.5,
  origins: ['OBSERVED'],
  evidence: [],
  supportCount: 1,
  recommendationState: 'REVIEW_REQUIRED',
  effectiveReviewState: null,
  latestDecisionId: null,
  ...overrides,
})

const identities = (candidates: CandidateResponse[]) => organizeCandidates(candidates).map((value) => value.identity)

describe('organizeCandidates', () => {
  it('groups every candidate kind and puts relationships after node groups', () => {
    const values = [
      candidate('RELATIONSHIP_PROPERTY', 'relationship-property:OWNS:since', { fromLabel: 'Customer', relationshipType: 'OWNS', toLabel: 'Account', property: 'since' }),
      candidate('NODE_PROPERTY', 'node-property:Customer:name', { label: 'Customer', property: 'name' }),
      candidate('RELATIONSHIP', 'relationship:Customer:OWNS:Account', { fromLabel: 'Customer', relationshipType: 'OWNS', toLabel: 'Account' }),
      candidate('NODE_KEY', 'node-key:Customer:id', { label: 'Customer', keys: ['id'] }),
      candidate('NODE', 'node:Customer', { label: 'Customer' }),
    ]

    expect(identities(values)).toEqual([
      'node:Customer',
      'node-key:Customer:id',
      'node-property:Customer:name',
      'relationship:Customer:OWNS:Account',
      'relationship-property:OWNS:since',
    ])
  })

  it('ranks nodes and children by confidence, support, kind, coordinate, and identity', () => {
    const values = [
      candidate('NODE', 'node:missing', { label: 'Missing', confidence: null, supportCount: 99 }),
      candidate('NODE', 'node:supported', { label: 'Supported', confidence: 0.8, supportCount: 4 }),
      candidate('NODE', 'node:strong', { label: 'Strong', confidence: 0.9, supportCount: 1 }),
      candidate('NODE_PROPERTY', 'property:z', { label: 'Strong', property: 'zeta', confidence: 0.7, supportCount: 5 }),
      candidate('NODE_PROPERTY', 'property:a', { label: 'Strong', property: 'alpha', confidence: 0.7, supportCount: 5 }),
      candidate('NODE_KEY', 'key:a', { label: 'Strong', keys: ['alpha'], confidence: 0.7, supportCount: 5 }),
      candidate('NODE_PROPERTY', 'property:high', { label: 'Strong', property: 'high', confidence: 0.8, supportCount: 1 }),
    ]

    expect(identities(values)).toEqual([
      'node:strong',
      'property:high',
      'key:a',
      'property:a',
      'property:z',
      'node:supported',
      'node:missing',
    ])
  })

  it('ranks relationships by recommendation before confidence and support', () => {
    const values = [
      candidate('RELATIONSHIP', 'relationship:suppressed', { fromLabel: 'A', relationshipType: 'SUPPRESSED', toLabel: 'B', recommendationState: 'SUPPRESSED', confidence: 1 }),
      candidate('RELATIONSHIP', 'relationship:low', { fromLabel: 'A', relationshipType: 'LOW', toLabel: 'B', recommendationState: 'LOW_SUPPORT', confidence: 1 }),
      candidate('RELATIONSHIP', 'relationship:review', { fromLabel: 'A', relationshipType: 'REVIEW', toLabel: 'B', recommendationState: 'REVIEW_REQUIRED', confidence: 1 }),
      candidate('RELATIONSHIP', 'relationship:recommended-low', { fromLabel: 'A', relationshipType: 'A', toLabel: 'B', recommendationState: 'RECOMMENDED', confidence: 0.4, supportCount: 4 }),
      candidate('RELATIONSHIP', 'relationship:recommended-high', { fromLabel: 'A', relationshipType: 'Z', toLabel: 'B', recommendationState: 'RECOMMENDED', confidence: 0.9, supportCount: 1 }),
    ]

    expect(identities(values)).toEqual([
      'relationship:recommended-high',
      'relationship:recommended-low',
      'relationship:review',
      'relationship:low',
      'relationship:suppressed',
    ])
  })

  it('retains unmatched children in deterministic fallback sections', () => {
    const values = [
      candidate('RELATIONSHIP_PROPERTY', 'relationship-property:missing', { relationshipType: 'MISSING', property: 'value', confidence: null }),
      candidate('NODE_PROPERTY', 'node-property:orphan-b', { label: 'Orphan', property: 'b', confidence: 0.5 }),
      candidate('NODE_PROPERTY', 'node-property:orphan-a', { label: 'Orphan', property: 'a', confidence: 0.8 }),
      candidate('NODE', 'node:known', { label: 'Known' }),
      candidate('RELATIONSHIP', 'relationship:known', { fromLabel: 'Known', relationshipType: 'LINKS', toLabel: 'Known' }),
    ]

    expect(identities(values)).toEqual([
      'node:known',
      'node-property:orphan-a',
      'node-property:orphan-b',
      'relationship:known',
      'relationship-property:missing',
    ])
  })

  it('returns the same stable order for shuffled equivalent input', () => {
    const values = [
      candidate('NODE', 'node:b', { label: 'B' }),
      candidate('NODE', 'node:a-2', { label: 'A' }),
      candidate('NODE', 'node:a-1', { label: 'A' }),
      candidate('NODE_PROPERTY', 'node-property:a:value', { label: 'A', property: 'value' }),
    ]

    expect(identities(values)).toEqual(identities([...values].reverse()))
    expect(identities(values)).toEqual(['node:a-1', 'node-property:a:value', 'node:a-2', 'node:b'])
  })
})
