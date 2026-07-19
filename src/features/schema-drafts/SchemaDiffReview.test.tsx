import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../test/helpers'
import { SchemaDiffReview } from './SchemaDiffReview'
import type { DiffItem } from './schemaDraftTypes'

const changes: DiffItem[] = [
  { coordinate: 'node-key:Award', compatibility: 'ADDITIVE', operation: 'ADD', before: null, after: ['title'] },
  { coordinate: 'node-key:Book', compatibility: 'REVIEW_REQUIRED', operation: 'ADD', before: null, after: ['isbn'] },
  { coordinate: 'Customer.age', compatibility: 'BREAKING', operation: 'CHANGE_TYPE', before: 'STRING', after: 'INTEGER' },
]

describe('SchemaDiffReview', () => {
  it('summarizes risk and lazily discloses exact before and after values', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemaDiffReview changes={changes} />)

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
    renderWithProviders(<SchemaDiffReview changes={changes} />)

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
})
