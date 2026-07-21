import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/helpers'
import { SchemaDiffReview } from './SchemaDiffReview'
import { baseSchemaDiffFixture, emptyBaselineDiffFixture, previousAggregateDiffFixture, rolloutCompatibleDiffFixture } from './schemaDraftFixtures'
import type { DecisionResponse, DiffItem } from './schemaDraftTypes'

const changes: DiffItem[] = [
  { coordinate: 'node-key:Award', compatibility: 'ADDITIVE', operation: 'ADD', before: null, after: ['title'] },
  { coordinate: 'node-key:Book', compatibility: 'REVIEW_REQUIRED', operation: 'ADD', before: null, after: ['isbn'] },
  { coordinate: 'Customer.age', compatibility: 'BREAKING', operation: 'CHANGE_TYPE', before: 'STRING', after: 'INTEGER' },
]

describe('SchemaDiffReview', () => {
  it('summarizes risk and lazily discloses exact before and after values', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemaDiffReview diff={{ ...baseSchemaDiffFixture, changes }} />)

    expect(screen.getByText(/Current aggregate/)).toHaveTextContent('Current aggregate aggregate-1 is compared with Base schema schema-1.')
    expect(screen.getByText('base-schema-sha')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3 schema changes in this aggregate')).toBeInTheDocument()
    expect(within(document.querySelector('.diff-risk-counts .additive')!).getByText('1')).toBeInTheDocument()
    expect(within(document.querySelector('.diff-risk-counts .review_required')!).getByText('1')).toBeInTheDocument()
    expect(within(document.querySelector('.diff-risk-counts .breaking')!).getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Showing all 3 changes')).toBeInTheDocument()
    expect(within(screen.getByText('Customer.age').closest('summary')!).getByText('Change type')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Before' })).not.toBeInTheDocument()
    expect(screen.queryByText('STRING')).not.toBeInTheDocument()

    const breakingSummary = screen.getByText('Customer.age').closest('summary')!
    breakingSummary.focus()
    expect(breakingSummary).toHaveFocus()
    expect(breakingSummary.tabIndex).toBe(0)
    await user.click(breakingSummary)

    const comparison = screen.getByRole('group', { name: 'Change values for Customer.age' })
    expect(within(comparison).getByRole('heading', { name: 'Before' })).toBeInTheDocument()
    expect(within(comparison).getByRole('heading', { name: 'After' })).toBeInTheDocument()
    expect(within(comparison).getByText('"STRING"')).toBeInTheDocument()
    expect(within(comparison).getByText('"INTEGER"')).toBeInTheDocument()

    const awardCoordinate = screen.getByText('node-key:Award')
    await user.click(awardCoordinate)
    const before = within(awardCoordinate.closest('details')!).getByLabelText('Before value')
    expect(within(before).getByText('No value')).toBeInTheDocument()
    expect(within(before).getByText('null')).toBeInTheDocument()
    expect(screen.getAllByText(/"title"/)).toHaveLength(1)
  })

  it('combines filters, preserves response order, reports results, and clears empty filters', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemaDiffReview diff={{ ...baseSchemaDiffFixture, changes }} />)

    const compatibility = screen.getByRole('combobox', { name: 'Compatibility status' })
    const operation = screen.getByRole('combobox', { name: 'Change operation' })
    await user.selectOptions(operation, 'ADD')

    expect(document.querySelectorAll('.diff-review-definition strong')).toHaveLength(2)
    expect([...document.querySelectorAll('.diff-review-definition strong')].map((element) => element.textContent)).toEqual(['node-key:Award', 'node-key:Book'])
    expect(screen.getByText('2 matching changes · 3 changes total')).toBeInTheDocument()

    await user.selectOptions(compatibility, 'REVIEW_REQUIRED')
    expect(screen.getByText('node-key:Book')).toBeInTheDocument()
    expect(screen.queryByText('node-key:Award')).not.toBeInTheDocument()
    expect(screen.getByText('1 matching change · 3 changes total')).toBeInTheDocument()

    await user.selectOptions(compatibility, 'BREAKING')
    expect(screen.getByText('No matching changes')).toBeInTheDocument()
    expect(screen.getByText('Clear or adjust the filters to see other compatibility changes.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(compatibility).toHaveValue('ALL')
    expect(operation).toHaveValue('ALL')
    expect(screen.getByText('Showing all 3 changes')).toBeInTheDocument()
    expect(document.querySelectorAll('.diff-review-item')).toHaveLength(3)
  })

  it.each([
    [previousAggregateDiffFixture, 'Previous aggregate aggregate-0', 'previous-aggregate-sha'],
    [emptyBaselineDiffFixture, 'Empty starting point', 'empty-schema-sha'],
  ])('names the backend-selected baseline and retains its audit hash', (diff, description, hash) => {
    renderWithProviders(<SchemaDiffReview diff={diff} />)
    expect(screen.getByText(/Current aggregate/)).toHaveTextContent(description)
    expect(screen.getByText(hash)).toBeInTheDocument()
    expect(screen.queryByText(/active schema/i)).not.toBeInTheDocument()
  })

  it('renders rollout-compatible changes with an honest unavailable baseline', () => {
    renderWithProviders(<SchemaDiffReview diff={rolloutCompatibleDiffFixture} />)
    expect(screen.getByText(/comparison baseline metadata unavailable/i)).toBeInTheDocument()
    expect(screen.getByText('Customer.age')).toBeInTheDocument()
    expect(screen.queryByText('Baseline content hash')).not.toBeInTheDocument()
  })

  it('attributes only an exact coordinate whose latest decision is reject', () => {
    const decision = (sequence: number, type: DecisionResponse['type'], candidateIdentity: string): DecisionResponse => ({
      id: `decision-${sequence}`, sequence, draftRevision: 7, type,
      reviewState: type === 'REJECT' ? 'REJECTED' : 'ACCEPTED', candidateIdentity,
      priorValue: null, resultingValue: null, rationale: null, createdAt: '2026-07-15T08:02:00Z',
    })
    const provenanceChanges: DiffItem[] = [
      { coordinate: 'node:Customer', compatibility: 'BREAKING', operation: 'REMOVE', before: {}, after: null },
      { coordinate: 'node-property:Customer:age', compatibility: 'BREAKING', operation: 'REMOVE', before: 'INTEGER', after: null },
      { coordinate: 'node-property:Customer:name', compatibility: 'BREAKING', operation: 'REMOVE', before: 'STRING', after: null },
    ]
    renderWithProviders(<SchemaDiffReview
      diff={{ ...baseSchemaDiffFixture, changes: provenanceChanges }}
      decisions={[
        decision(4, 'REJECT', 'node:Customer'),
        decision(2, 'REJECT', 'node-property:Customer:age'),
        decision(6, 'ACCEPT', 'node-property:Customer:age'),
      ]}
    />)

    expect(within(screen.getByText('node:Customer').closest('summary')!).getByText('Explicitly rejected')).toBeInTheDocument()
    expect(within(screen.getByText('node:Customer').closest('summary')!).getByText('Breaking')).toBeInTheDocument()
    expect(within(screen.getByText('node-property:Customer:age').closest('summary')!).queryByText('Explicitly rejected')).not.toBeInTheDocument()
    expect(within(screen.getByText('node-property:Customer:name').closest('summary')!).queryByText('Explicitly rejected')).not.toBeInTheDocument()
  })

  it('exposes responsive containers without eagerly rendering comparison values', () => {
    renderWithProviders(<SchemaDiffReview diff={baseSchemaDiffFixture} decisions={[{
      id: 'decision-1', sequence: 1, draftRevision: 7, type: 'REJECT', reviewState: 'REJECTED',
      candidateIdentity: 'Customer.age', priorValue: null, resultingValue: null, rationale: null, createdAt: '2026-07-15T08:02:00Z',
    }]} />)
    expect(document.querySelector('.diff-comparison-summary')).toBeInTheDocument()
    expect(document.querySelector('.diff-review-labels')).toHaveTextContent('BreakingExplicitly rejected')
    expect(screen.queryByRole('group', { name: 'Change values for Customer.age' })).not.toBeInTheDocument()
  })
})
