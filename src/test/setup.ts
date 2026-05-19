import '@testing-library/jest-dom/vitest'
import React from 'react'

vi.mock('json-edit-react', () => ({
  JsonEditor: ({
    id,
    data,
    setData,
    restrictEdit,
    restrictAdd,
    restrictDelete,
    restrictDrag,
  }: {
    id?: string
    data: unknown
    setData?: (data: unknown) => void
    restrictEdit?: boolean
    restrictAdd?: boolean
    restrictDelete?: boolean
    restrictDrag?: boolean
  }) => React.createElement(
    'div',
    { 'data-testid': `${id ?? 'json'}-json-edit-react` },
    React.createElement('textarea', {
      'aria-label': 'Mock structured JSON data',
      value: JSON.stringify(data, null, 2),
      disabled: restrictEdit,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setData?.(JSON.parse(event.target.value) as unknown)
      },
    }),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: restrictEdit,
        onClick: () => setData?.({ ...(isObjectRecord(data) ? data : {}), type: 'string' }),
      },
      'Mock edit primitive',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: restrictAdd,
        onClick: () => setData?.({ ...(isObjectRecord(data) ? data : {}), addedNode: { type: 'number' } }),
      },
      'Mock add node',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: restrictDelete,
        onClick: () => {
          const next = { ...(isObjectRecord(data) ? data : {}) }
          delete next.addedNode
          setData?.(next)
        },
      },
      'Mock remove node',
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        disabled: restrictDrag,
        onClick: () => setData?.({ moved: true, ...(isObjectRecord(data) ? data : {}) }),
      },
      'Mock move node',
    ),
  ),
  githubLightTheme: {},
}))

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
