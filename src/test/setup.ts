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

vi.mock('@xyflow/react', () => ({
  ReactFlow: ({
    nodes = [],
    edges = [],
    onNodeClick,
    onEdgeClick,
    onConnect,
    children,
  }: {
    nodes?: Array<{ id: string; data?: { label?: string } }>
    edges?: Array<{
      id: string
      label?: string
      source?: string
      target?: string
      data?: {
        label?: string
        relationshipId?: string
        onSelectRelationship?: (relationshipId: string) => void
      }
    }>
    onNodeClick?: (event: unknown, node: { id: string }) => void
    onEdgeClick?: (event: unknown, edge: { id: string }) => void
    onConnect?: (connection: { source: string; target: string }) => void
    children?: React.ReactNode
  }) => React.createElement(
    'div',
    { 'data-testid': 'mock-react-flow' },
    nodes.map((node) =>
      React.createElement(
        'button',
        {
          key: node.id,
          type: 'button',
          onClick: () => onNodeClick?.({}, node),
        },
        node.data?.label ?? node.id,
      ),
    ),
    edges.map((edge) =>
      React.createElement(
        'button',
        {
          key: edge.id,
          type: 'button',
          onClick: () => {
            if (edge.data?.relationshipId && edge.data.onSelectRelationship) {
              edge.data.onSelectRelationship(edge.data.relationshipId)
            } else {
              onEdgeClick?.({}, edge)
            }
          },
        },
        edge.data?.label ? `Select relationship ${edge.data.label}` : edge.label ?? edge.id,
      ),
    ),
    nodes.length >= 2
      ? React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onConnect?.({ source: nodes[0].id, target: nodes[1].id }),
        },
        'Mock connect first two nodes',
      )
      : null,
    children,
  ),
  Handle: () => null,
  Background: () => React.createElement('div', { 'data-testid': 'mock-flow-background' }),
  Controls: () => React.createElement('div', { 'data-testid': 'mock-flow-controls' }),
  MiniMap: () => React.createElement('div', { 'data-testid': 'mock-flow-minimap' }),
  MarkerType: { ArrowClosed: 'arrowclosed' },
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
}))

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
