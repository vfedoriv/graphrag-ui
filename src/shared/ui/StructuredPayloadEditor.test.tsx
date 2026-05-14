import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StructuredPayloadEditor } from './StructuredPayloadEditor'

describe('StructuredPayloadEditor', () => {
  it('formats valid JSON payload', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StructuredPayloadEditor
        id='json-editor'
        format='json'
        value='{"a":1}'
        onChange={onChange}
        onErrorChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Format JSON' }))

    expect(onChange).toHaveBeenCalledWith('{\n  "a": 1\n}')
  })

  it('reports formatting error for invalid JSON payload', async () => {
    const user = userEvent.setup()
    const onErrorChange = vi.fn()
    render(
      <StructuredPayloadEditor
        id='json-editor'
        format='json'
        value='{'
        onChange={vi.fn()}
        onErrorChange={onErrorChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Format JSON' }))

    expect(onErrorChange).toHaveBeenCalledWith('Cannot format invalid JSON payload.')
  })

})
