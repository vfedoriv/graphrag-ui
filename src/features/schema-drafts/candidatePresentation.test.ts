import { describe, expect, it } from 'vitest'
import { candidateChanges, candidateEndpoints, candidateKindLabel, candidateSupportingValue, candidateTitle, formatConfidence, formatSupport, recommendationLabel, reviewStateLabel } from './candidatePresentation'
import { candidateFixture } from './schemaDraftFixtures'
import type { CandidateKind, CandidateResponse } from './schemaDraftTypes'

const candidate = (kind: CandidateKind, overrides: Partial<CandidateResponse> = {}): CandidateResponse => ({ ...candidateFixture, kind, ...overrides })

describe('candidate presentation', () => {
  it.each([
    ['NODE', 'Customer', 'Node'],
    ['NODE_PROPERTY', 'Customer.customerId', 'STRING'],
    ['NODE_KEY', 'Customer key: customerId, tenantId', 'Identity key'],
    ['RELATIONSHIP', 'Account —[OWNS]→ Asset', 'Relationship'],
    ['RELATIONSHIP_PROPERTY', 'OWNS.since', 'DATE'],
  ] as const)('describes %s coordinates', (kind, title, supporting) => {
    const value = candidate(kind, { label: 'Customer', property: kind === 'RELATIONSHIP_PROPERTY' ? 'since' : 'customerId', propertyType: kind === 'RELATIONSHIP_PROPERTY' ? 'DATE' : 'STRING', keys: ['customerId', 'tenantId'], relationshipType: 'OWNS', fromLabel: 'Account', toLabel: 'Asset' })
    expect(candidateTitle(value)).toBe(title)
    expect(candidateSupportingValue(value)).toBe(supporting)
    expect(candidateKindLabel(kind)).toBeTruthy()
  })

  it('exposes relationship endpoints and normalization changes', () => {
    const value = candidate('RELATIONSHIP_PROPERTY', { label: 'Customer', originalLabel: 'customer', property: 'openedAt', originalProperty: 'opened_at', relationshipType: 'OPENED', originalRelationshipType: 'opened', fromLabel: 'Customer', toLabel: 'Ticket' })
    expect(candidateEndpoints(value)).toBe('Customer → Ticket')
    expect(candidateChanges(value)).toEqual(['Label: customer → Customer', 'Property: opened_at → openedAt', 'Relationship type: opened → OPENED'])
  })

  it('formats independent support and confidence without conflating evidence count', () => {
    expect(formatSupport(0)).toBe('No observed source support')
    expect(formatSupport(1)).toBe('Supported by 1 independent source')
    expect(formatSupport(3)).toBe('Supported by 3 independent sources')
    expect(formatConfidence(null)).toBe('Not provided')
    expect(formatConfidence(0)).toBe('0%')
    expect(formatConfidence(0.976)).toBe('98%')
  })

  it('labels analyzer recommendations separately from persistent review state', () => {
    expect(recommendationLabel('RECOMMENDED')).toBe('Recommended')
    expect(recommendationLabel('LOW_SUPPORT')).toBe('Low support')
    expect(reviewStateLabel(null)).toBe('Unreviewed')
    expect(reviewStateLabel('PENDING')).toBe('Unreviewed')
    expect(reviewStateLabel('ACCEPTED')).toBe('Accepted')
  })
})
