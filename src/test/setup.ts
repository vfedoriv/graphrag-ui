import '@testing-library/jest-dom/vitest'
import React from 'react'

vi.mock('@visual-json/react', () => ({
  JsonEditor: ({
    value,
    onChange,
    readOnly,
  }: {
    value: unknown
    onChange?: (data: unknown) => void
    readOnly?: boolean
  }) => React.createElement(
    'div',
    { 'data-testid': 'visual-json-editor' },
    React.createElement('textarea', {
      'aria-label': 'Mock structured JSON data',
      value: JSON.stringify(value, null, 2),
      disabled: readOnly,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(JSON.parse(event.target.value) as unknown)
      },
    }),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: readOnly,
        onClick: () => onChange?.({ ...(isObjectRecord(value) ? value : {}), type: 'string' }),
      },
      'Mock edit primitive',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: readOnly,
        onClick: () => onChange?.({ ...(isObjectRecord(value) ? value : {}), addedNode: { type: 'number' } }),
      },
      'Mock add node',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: readOnly,
        onClick: () => {
          const next = { ...(isObjectRecord(value) ? value : {}) }
          delete next.addedNode
          onChange?.(next)
        },
      },
      'Mock remove node',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: readOnly,
        onClick: () => onChange?.({ moved: true, ...(isObjectRecord(value) ? value : {}) }),
      },
      'Mock move node',
    ),
  ),
}))

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
