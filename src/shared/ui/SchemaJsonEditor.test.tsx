import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemaJsonEditor } from './SchemaJsonEditor'

describe('SchemaJsonEditor', () => {
  it('serializes primitive edits from the structured editor', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value='{"type":"object"}'
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mock edit primitive' }))

    expect(onChange).toHaveBeenCalledWith('{\n  "type": "string"\n}')
  })

  it('serializes add, remove, and move updates from the structured editor', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value='{"type":"object"}'
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mock add node' }))
    expect(onChange).toHaveBeenLastCalledWith('{\n  "type": "object",\n  "addedNode": {\n    "type": "number"\n  }\n}')

    rerender(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value='{"type":"object","addedNode":{"type":"number"}}'
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Mock remove node' }))
    expect(onChange).toHaveBeenLastCalledWith('{\n  "type": "object"\n}')

    await user.click(screen.getByRole('button', { name: 'Mock move node' }))
    expect(onChange).toHaveBeenLastCalledWith('{\n  "moved": true,\n  "type": "object",\n  "addedNode": {\n    "type": "number"\n  }\n}')
  })

  it('initializes empty drafts as an editable object', () => {
    const onChange = vi.fn()

    render(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value=''
        onChange={onChange}
      />,
    )

    expect(screen.getByTestId('schema-editor-json-edit-react')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('{}')
  })

  it('preserves invalid draft text and shows a parse error', () => {
    const onChange = vi.fn()

    render(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value='{'
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Cannot render invalid JSON as structured data. Fix the JSON to continue structured editing.')).toBeInTheDocument()
    const fallback = screen.getByLabelText('Schema JSON content')
    expect(fallback).toHaveValue('{')

    fireEvent.change(fallback, { target: { value: '{"type":"object"}' } })
    expect(onChange).toHaveBeenCalledWith('{"type":"object"}')
  })
})
