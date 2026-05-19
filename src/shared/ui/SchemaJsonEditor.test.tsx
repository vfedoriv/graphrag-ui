import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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

    expect(screen.getByTestId('visual-json-editor')).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith('{}')
  })

  it('preserves invalid draft text in Raw View and shows a parse error', () => {
    const onChange = vi.fn()

    render(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value='{'
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Cannot render invalid JSON as Tree View. Fix the JSON in Raw View to continue structured editing.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tree View' })).toBeDisabled()
    const rawView = screen.getByLabelText('Schema JSON content')
    expect(rawView).toHaveValue('{')

    fireEvent.change(rawView, { target: { value: '{"type":"object"}' } })
    expect(onChange).toHaveBeenLastCalledWith('{"type":"object"}')
  })

  it('switches from Tree View to Raw View without changing valid draft content', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Raw View' }))

    expect(screen.getByLabelText('Schema JSON content')).toHaveValue('{"type":"object"}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('edits valid complete JSON in Raw View and renders it back through Tree View', async () => {
    const user = userEvent.setup()

    render(<ControlledSchemaJsonEditor initialValue='{"type":"object"}' />)

    await user.click(screen.getByRole('button', { name: 'Raw View' }))
    const rawView = screen.getByLabelText('Schema JSON content')
    fireEvent.change(rawView, { target: { value: '{"type":"string","title":"Customer"}' } })
    await user.click(screen.getByRole('button', { name: 'Tree View' }))

    expect(screen.getByTestId('visual-json-editor')).toBeInTheDocument()
    expect(screen.getByLabelText('Mock structured JSON data')).toHaveValue('{\n  "type": "string",\n  "title": "Customer"\n}')
  })

  it('preserves invalid pasted JSON in Raw View with a parse error', async () => {
    const user = userEvent.setup()

    render(<ControlledSchemaJsonEditor initialValue='{"type":"object"}' />)

    await user.click(screen.getByRole('button', { name: 'Raw View' }))
    const rawView = screen.getByLabelText('Schema JSON content')
    fireEvent.change(rawView, { target: { value: '{"type":' } })

    expect(rawView).toHaveValue('{"type":')
    expect(screen.getByText('Cannot render invalid JSON as Tree View. Fix the JSON in Raw View to continue structured editing.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tree View' })).toBeDisabled()
  })

  it('prevents Raw View edits and structured changes when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SchemaJsonEditor
        id='schema-editor'
        label='Schema JSON content'
        value='{"type":"object"}'
        onChange={onChange}
        disabled
      />,
    )

    expect(screen.getByRole('button', { name: 'Mock edit primitive' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Raw View' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Mock edit primitive' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})

function ControlledSchemaJsonEditor({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue)

  return (
    <SchemaJsonEditor
      id='schema-editor'
      label='Schema JSON content'
      value={value}
      onChange={setValue}
    />
  )
}
