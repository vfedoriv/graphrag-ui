import { describe, expect, it } from 'vitest'
import { candidateFixture } from './schemaDraftFixtures'
import type { CandidateResponse } from './schemaDraftTypes'
import { defaultCandidateFilters, filterCandidates, type CandidateFilters } from './filterCandidates'

const candidate = (identity: string, overrides: Partial<CandidateResponse> = {}): CandidateResponse => ({
  ...candidateFixture,
  identity,
  ...overrides,
})

const filter = (candidates: CandidateResponse[], overrides: Partial<CandidateFilters>) =>
  filterCandidates(candidates, { ...defaultCandidateFilters, ...overrides }).map((value) => value.identity)

describe('filterCandidates', () => {
  const canonical = candidate('node-property:Customer:customerId', {
    label: 'Customer',
    property: 'customerId',
    propertyType: 'UUID',
    originalLabel: 'customer_record',
    originalProperty: 'customer_id',
  })
  const relationship = candidate('relationship-property:Customer:OWNS:Account:since', {
    kind: 'RELATIONSHIP_PROPERTY',
    label: null,
    property: 'since',
    keys: ['tenantId', 'accountId'],
    relationshipType: 'OWNS',
    fromLabel: 'Customer',
    toLabel: 'Account',
    originalRelationshipType: 'has_account',
  })

  it('matches blank and case-insensitive text against canonical and original coordinates', () => {
    expect(filter([canonical, relationship], { text: '   ' })).toEqual([canonical.identity, relationship.identity])
    expect(filter([canonical, relationship], { text: '  CUSTOMERID ' })).toEqual([canonical.identity])
    expect(filter([canonical, relationship], { text: 'CUSTOMER_RECORD' })).toEqual([canonical.identity])
    expect(filter([canonical, relationship], { text: 'customer_id' })).toEqual([canonical.identity])
  })

  it('matches relationship endpoints, types, keys, original types, and identities', () => {
    expect(filter([canonical, relationship], { text: 'Account' })).toEqual([relationship.identity])
    expect(filter([canonical, relationship], { text: 'OWNS' })).toEqual([relationship.identity])
    expect(filter([canonical, relationship], { text: 'tenantId' })).toEqual([relationship.identity])
    expect(filter([canonical, relationship], { text: 'has_account' })).toEqual([relationship.identity])
    expect(filter([canonical, relationship], { text: 'relationship-property:' })).toEqual([relationship.identity])
  })

  it('filters every categorical dimension by exact values', () => {
    const first = candidate('first', { kind: 'NODE', recommendationState: 'RECOMMENDED', effectiveReviewState: 'ACCEPTED', origins: ['OBSERVED'] })
    const second = candidate('second', { kind: 'NODE_PROPERTY', recommendationState: 'LOW_SUPPORT', effectiveReviewState: 'REJECTED', origins: ['GUIDED', 'INFERRED'] })

    expect(filter([first, second], { kind: 'NODE' })).toEqual(['first'])
    expect(filter([first, second], { recommendation: 'LOW_SUPPORT' })).toEqual(['second'])
    expect(filter([first, second], { reviewState: 'ACCEPTED' })).toEqual(['first'])
    expect(filter([first, second], { origin: 'INFERRED' })).toEqual(['second'])
  })

  it('normalizes null and PENDING review states as unreviewed', () => {
    const unset = candidate('unset', { effectiveReviewState: null })
    const pending = candidate('pending', { effectiveReviewState: 'PENDING' })
    const accepted = candidate('accepted', { effectiveReviewState: 'ACCEPTED' })

    expect(filter([unset, pending, accepted], { reviewState: 'UNREVIEWED' })).toEqual(['unset', 'pending'])
  })

  it('combines criteria with AND semantics and preserves input order', () => {
    const candidates = [
      candidate('third', { kind: 'NODE', recommendationState: 'RECOMMENDED', origins: ['GUIDED'], label: 'Account' }),
      candidate('first', { kind: 'NODE', recommendationState: 'RECOMMENDED', origins: ['GUIDED'], label: 'Customer' }),
      candidate('second', { kind: 'NODE', recommendationState: 'LOW_SUPPORT', origins: ['GUIDED'], label: 'Customer' }),
    ]

    expect(filter(candidates, { text: 'account', kind: 'NODE', recommendation: 'RECOMMENDED', origin: 'GUIDED' })).toEqual(['third'])
    expect(filter(candidates, { kind: 'NODE' })).toEqual(['third', 'first', 'second'])
  })
})
