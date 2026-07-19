import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { isJsonValue } from '../lib/isJsonValue'
import { JsonTreeView } from './JsonTreeView'

describe('JsonTreeView', () => {
  it('renders an accessible editable tree with the configured minimum height', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <JsonTreeView
        label='Schema tree'
        value={{ type: 'object' }}
        onChange={onChange}
        minHeight={320}
      />,
    )

    expect(screen.getByRole('group', { name: 'Schema tree' })).toHaveStyle({ minHeight: '320px' })
    expect(screen.getByLabelText('Mock structured JSON data')).toHaveValue(JSON.stringify({ type: 'object' }, null, 2))

    await user.click(screen.getByRole('button', { name: 'Mock edit primitive' }))
    expect(onChange).toHaveBeenCalledWith({ type: 'string' })
  })

  it('prevents tree mutations in read-only mode', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <JsonTreeView
        label='Projected schema'
        value={{ nodes: [{ label: 'Customer' }] }}
        onChange={onChange}
        readOnly
      />,
    )

    expect(screen.getByRole('group', { name: 'Projected schema' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByLabelText('Mock structured JSON data')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Mock edit primitive' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('identifies only finite, acyclic JSON-compatible values', () => {
    expect(isJsonValue({ nodes: [{ label: 'Customer' }], version: 2, active: true })).toBe(true)
    expect(isJsonValue(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isJsonValue(new Date())).toBe(false)

    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(isJsonValue(circular)).toBe(false)
  })
})
