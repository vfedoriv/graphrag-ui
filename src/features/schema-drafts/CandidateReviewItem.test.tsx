import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CandidateReviewItem } from './CandidateReviewItem'
import { candidateFixture } from './schemaDraftFixtures'
import { renderWithProviders } from '../../test/helpers'

function renderCandidate(overrides: Partial<ComponentProps<typeof CandidateReviewItem>> = {}) {
  const onDecide = vi.fn()
  renderWithProviders(<CandidateReviewItem
    candidate={candidateFixture}
    readOnly={false}
    actionsDisabled={false}
    isPending={false}
    onDecide={onDecide}
    onShowDecision={vi.fn()}
    {...overrides}
  />)
  return { onDecide }
}

async function openCandidate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Customer.customerId'))
}

function replaceCandidateJson(value: unknown) {
  const editor = screen.getAllByRole('textbox').find((element) => element instanceof HTMLTextAreaElement)
  if (!editor) throw new Error('Candidate JSON editor is unavailable')
  fireEvent.change(editor, {
    target: { value: typeof value === 'string' ? value : JSON.stringify(value) },
  })
}

describe('CandidateReviewItem', () => {
  it('emits a modify decision with the edited value and optional rationale', async () => {
    const { onDecide } = renderCandidate()
    const user = userEvent.setup()
    const modifiedCandidate = { ...candidateFixture, propertyType: 'UUID' }

    await openCandidate(user)
    await user.type(screen.getByLabelText('Optional rationale for Customer.customerId'), 'Use the canonical identifier')
    await user.click(screen.getByRole('button', { name: 'Modify' }))
    replaceCandidateJson(modifiedCandidate)
    await user.click(screen.getByRole('button', { name: 'Submit modify' }))

    expect(onDecide).toHaveBeenCalledOnce()
    expect(onDecide).toHaveBeenCalledWith(candidateFixture, 'MODIFY', modifiedCandidate, 'Use the canonical identifier')
  })

  it('cancels an edit without a decision, then emits a pin decision without rationale', async () => {
    const { onDecide } = renderCandidate()
    const user = userEvent.setup()

    await openCandidate(user)
    await user.click(screen.getByRole('button', { name: 'Modify' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Submit modify' })).not.toBeInTheDocument()
    expect(onDecide).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Pin' }))
    await user.click(screen.getByRole('button', { name: 'Submit pin' }))

    expect(onDecide).toHaveBeenCalledOnce()
    expect(onDecide).toHaveBeenCalledWith(candidateFixture, 'PIN', candidateFixture, undefined)
  })

  it('shows malformed JSON validation and does not emit a decision', async () => {
    const { onDecide } = renderCandidate()
    const user = userEvent.setup()

    await openCandidate(user)
    await user.click(screen.getByRole('button', { name: 'Modify' }))
    replaceCandidateJson('{')
    await user.click(screen.getByRole('button', { name: 'Submit modify' }))

    expect(screen.getByText(/Expected property name/)).toBeInTheDocument()
    expect(onDecide).not.toHaveBeenCalled()
  })

  it('shows validation when a modified identity or pinned kind changes', async () => {
    const { onDecide } = renderCandidate()
    const user = userEvent.setup()
    const invariantError = 'Modified or pinned value must preserve candidate identity and kind.'

    await openCandidate(user)
    await user.click(screen.getByRole('button', { name: 'Modify' }))
    replaceCandidateJson({ ...candidateFixture, identity: 'node-property:Customer:externalId' })
    await user.click(screen.getByRole('button', { name: 'Submit modify' }))
    expect(screen.getByText(invariantError)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Pin' }))
    replaceCandidateJson({ ...candidateFixture, kind: 'NODE' })
    await user.click(screen.getByRole('button', { name: 'Submit pin' }))

    expect(screen.getByText(invariantError)).toBeInTheDocument()
    expect(onDecide).not.toHaveBeenCalled()
  })

  it('disables decision actions while pending', async () => {
    renderCandidate({ isPending: true })
    const user = userEvent.setup()

    await openCandidate(user)

    const pendingButtons = screen.getAllByRole('button', { name: 'Working...' })
    expect(pendingButtons).toHaveLength(2)
    pendingButtons.forEach((button) => expect(button).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Modify' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Pin' })).toBeDisabled()
  })

  it('hides decision controls in the read-only state', async () => {
    renderCandidate({ readOnly: true })
    const user = userEvent.setup()

    await openCandidate(user)

    expect(screen.queryByLabelText('Optional rationale for Customer.customerId')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modify' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument()
  })
})
