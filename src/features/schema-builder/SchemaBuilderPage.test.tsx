import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemaBuilderPage } from './SchemaBuilderPage'
import { buildSchemaFlowEdges, buildSchemaFlowNodes, routeRelationshipPath } from './schemaBuilderFlow'
import { parseSchemaContentToDraft, serializeSchemaDraft } from './schemaBuilderMapping'
import { renderWithProviders, jsonResponse, stubFetch } from '../../test/helpers'

const importedSchemaContent = JSON.stringify({
  name: 'legal-contracts',
  version: 1,
  nodes: [
    {
      label: 'Contract',
      key: 'contractId',
      properties: [{ name: 'contractId', type: 'string', required: true }],
    },
    {
      label: 'Party',
      key: 'name',
      properties: [{ name: 'name', type: 'string', required: true }],
    },
  ],
  relationships: [{ type: 'HAS_PARTY', from: 'Contract', to: 'Party' }],
  indexes: [{ label: 'Contract', properties: ['contractId'], unique: true }],
})

const denseRelationshipSchemaContent = JSON.stringify({
  name: 'dense-relationships',
  version: 1,
  nodes: [
    {
      label: 'Person',
      key: 'fullName',
      properties: [{ name: 'fullName', type: 'string', required: true }],
    },
    {
      label: 'Location',
      key: 'country',
      properties: [{ name: 'country', type: 'string', required: true }],
    },
    {
      label: 'Nationality',
      key: 'name',
      properties: [{ name: 'name', type: 'string', required: true }],
    },
  ],
  relationships: [
    { type: 'BORN_IN', from: 'Person', to: 'Location' },
    { type: 'EMIGRATED_TO', from: 'Person', to: 'Location' },
    { type: 'HAS_NATIONALITY', from: 'Person', to: 'Nationality' },
  ],
})

function renderBuilder(initialEntry = '/schema-builder', strict = false) {
  const page = (
    <MemoryRouter initialEntries={[initialEntry]}>
      <SchemaBuilderPage />
    </MemoryRouter>
  )

  return renderWithProviders(
    strict ? <StrictMode>{page}</StrictMode> : page,
    { selectedKnowledgeBaseId: 'kb-a' },
  )
}

describe('SchemaBuilderPage', () => {
  beforeEach(() => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'kb-a')
    sessionStorage.clear()
    stubFetch(async (url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas')) {
        return jsonResponse(200, [
          { id: 'schema-1', name: 'Legal', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' },
        ])
      }
      if (url.endsWith('/schemas/schema-1') && (!init?.method || init.method === 'GET')) {
        return jsonResponse(200, {
          id: 'schema-1',
          name: 'Legal',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'h',
          status: 'ACTIVE',
          createdAt: '',
          content: importedSchemaContent,
        })
      }
      if (url.endsWith('/schemas/validate')) {
        return jsonResponse(200, { valid: true, errors: [] })
      }
      if (url.endsWith('/schemas/schema-1') && init?.method === 'PUT') {
        return jsonResponse(200, {
          id: 'schema-1',
          name: 'legal-contracts',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'updated',
          status: 'INACTIVE',
          createdAt: '',
          content: String(init.body),
        })
      }
      if (url.endsWith('/schemas') && init?.method === 'POST') {
        return jsonResponse(200, { id: 'schema-new', name: 'legal-contracts', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'INACTIVE', createdAt: '' })
      }
      return jsonResponse(200, [])
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('imports an existing schema into visual elements and raw JSON', async () => {
    const user = userEvent.setup()
    renderBuilder('/schema-builder?schemaId=schema-1', true)

    expect(await screen.findByRole('combobox', { name: 'Import existing schema' })).toHaveValue('schema-1')
    expect(await screen.findByRole('button', { name: 'Contract' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select relationship HAS_PARTY' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Raw View' }))
    expect((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value).toContain('"indexes"')
  })

  it('does not flash the workflow progress banner while importing an existing schema', async () => {
    let resolveSchemaDetails: (response: ReturnType<typeof jsonResponse>) => void = () => undefined
    const schemaDetails = new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
      resolveSchemaDetails = resolve
    })
    const fetchMock = stubFetch(async (url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas')) {
        return jsonResponse(200, [
          { id: 'schema-1', name: 'Legal', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' },
        ])
      }
      if (url.endsWith('/schemas/schema-1') && (!init?.method || init.method === 'GET')) {
        return schemaDetails
      }
      return jsonResponse(200, [])
    })

    renderBuilder('/schema-builder?schemaId=schema-1')

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/v1/schemas/schema-1'))).toBe(true)
    })
    expect(screen.queryByText('Waiting for schema builder workflow response...')).not.toBeInTheDocument()

    resolveSchemaDetails(jsonResponse(200, {
      id: 'schema-1',
      name: 'Legal',
      version: 1,
      sourceType: 'PREDEFINED',
      format: 'JSON',
      contentHash: 'h',
      status: 'ACTIVE',
      createdAt: '',
      content: importedSchemaContent,
    }))
    expect(await screen.findByRole('button', { name: 'Contract' })).toBeInTheDocument()
  })

  it('selects a relationship when its canvas label is clicked', async () => {
    const user = userEvent.setup()
    renderBuilder('/schema-builder?schemaId=schema-1')

    await user.click(await screen.findByRole('button', { name: 'Select relationship HAS_PARTY' }))

    expect(screen.getByLabelText('Type')).toHaveValue('HAS_PARTY')
    expect(screen.getByLabelText('From node')).toHaveValue('node-contract-1')
    expect(screen.getByLabelText('To node')).toHaveValue('node-party-2')
  })

  it('supports blank draft visual edits and raw JSON synchronization', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Add node' }))
    await user.click(screen.getByRole('button', { name: 'Node1' }))
    await user.clear(screen.getByLabelText('Label'))
    await user.type(screen.getByLabelText('Label'), 'Contract')
    await user.click(screen.getByRole('button', { name: 'Raw View' }))

    expect((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value).toContain('"Contract"')
  })

  it('shows a drag preview while keeping the schema node in place until drop', async () => {
    const user = userEvent.setup()
    renderBuilder('/schema-builder?schemaId=schema-1')

    const contractNode = await screen.findByTestId('mock-flow-node-node-contract-1')
    expect(contractNode).toHaveAttribute('data-position', '80,80')

    await user.click(screen.getByRole('button', { name: 'Mock drag Contract' }))
    expect(screen.getByTestId('mock-flow-node-node-contract-1')).toHaveAttribute('data-position', '80,80')
    expect(screen.getByTestId('schema-node-drag-preview-node-contract-1')).toHaveStyle({ left: '180px', top: '130px' })

    await user.click(screen.getByRole('button', { name: 'Mock drop Contract' }))
    expect(screen.getByTestId('mock-flow-node-node-contract-1')).toHaveAttribute('data-position', '180,130')
    expect(screen.queryByTestId('schema-node-drag-preview-node-contract-1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Raw View' }))
    const serializedSchema = JSON.parse((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value)
    expect(JSON.stringify(serializedSchema)).not.toContain('position')
    expect(JSON.stringify(serializedSchema)).not.toContain('drag')
  })

  it('preserves invalid raw JSON and blocks submit actions', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Raw View' }))
    const rawEditor = screen.getByLabelText('Schema builder JSON content')
    fireEvent.change(rawEditor, { target: { value: '{{' } })

    expect(await screen.findByText('JSON parse error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create schema' })).toBeDisabled()
    expect(rawEditor).toHaveValue('{{')
  })

  it('validates, updates, and creates through schema APIs', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderBuilder('/schema-builder?schemaId=schema-1')

    await screen.findByRole('button', { name: 'Contract' })
    await user.click(screen.getByRole('button', { name: 'Validate' }))
    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Update source' }))
    expect(await screen.findByText('Schema legal-contracts v1 updated.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create schema' }))
    expect(await screen.findByText('Schema legal-contracts v1 created.')).toBeInTheDocument()

    await waitFor(() => {
      expect(queryClient.getQueryCache().findAll().length).toBeGreaterThan(0)
    })
  })

  it('loads unsaved generated content from session handoff', async () => {
    const generated = JSON.stringify({
      name: 'generated',
      version: 2,
      nodes: [{ label: 'Asset', key: 'assetId', properties: [{ name: 'assetId', type: 'string', required: true }] }],
      relationships: [],
    })
    sessionStorage.setItem('graphrag.schemaBuilderDraft', generated)
    renderBuilder('/schema-builder?draft=session')

    expect(await screen.findByRole('button', { name: 'Asset' })).toBeInTheDocument()
  })

  it('derives selected relationship edge and endpoint node presentation state', () => {
    const result = parseSchemaContentToDraft(denseRelationshipSchemaContent)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const selectedRelationship = result.draft.relationships[1]
    const selectedElement = { kind: 'relationship' as const, id: selectedRelationship.id }

    const nodes = buildSchemaFlowNodes(result.draft, selectedElement)
    expect(nodes.filter((node) => node.data.isRelationshipEndpoint).map((node) => node.data.label)).toEqual(['Person', 'Location'])

    const edges = buildSchemaFlowEdges(result.draft, selectedElement)
    const selectedEdge = edges.find((edge) => edge.id === selectedRelationship.id)
    expect(selectedEdge).toMatchObject({
      type: 'schemaRelationship',
      selected: true,
      data: {
        label: 'EMIGRATED_TO',
        isSelected: true,
      },
    })
    expect(selectedEdge?.data?.labelOffset.y).not.toBe(0)
    expect(selectedEdge?.sourceHandle).toMatch(/^source-(left|right|top|bottom)-(20|50|80)$/)
    expect(selectedEdge?.targetHandle).toMatch(/^target-(left|right|top|bottom)-(20|50|80)$/)
    expect(selectedEdge?.data?.route.sourceHandle).toBe(selectedEdge?.sourceHandle)
    expect(selectedEdge?.data?.route.nodeBounds.length).toBe(result.draft.nodes.length)

    const clearedNodes = buildSchemaFlowNodes(result.draft, { kind: 'node', id: result.draft.nodes[0].id })
    expect(clearedNodes.some((node) => node.data.isRelationshipEndpoint)).toBe(false)
  })

  it('renders relationship paths as curved cubic edges', () => {
    const routed = routeRelationshipPath({
      sourceX: 0,
      sourceY: 50,
      targetX: 300,
      targetY: 160,
      route: {
        sourceNodeId: 'source',
        targetNodeId: 'target',
        sourceHandle: 'source-right-50',
        targetHandle: 'target-left-50',
        centerXOffset: 0,
        centerYOffset: 0,
        nodeBounds: [{ id: 'obstacle', x: 100, y: 0, width: 100, height: 100 }],
      },
    })

    expect(routed.path).toMatch(/^M 0 50 C /)
    expect(routed.path).toContain(' C ')
    expect(routed.path).toContain('300 160')
    expect(routed.path).not.toContain(' Q ')
  })

  it('returns a label leader path when a relationship label is offset from its route', () => {
    const routed = routeRelationshipPath({
      sourceX: 0,
      sourceY: 50,
      targetX: 300,
      targetY: 50,
      label: 'OFFSET_LABEL',
      labelOffset: { x: 0, y: 56 },
    })

    expect(routed.labelLeaderPath).toMatch(/^M /)
    expect(routed.labelLeaderPath).toContain(`L ${routed.labelX} ${routed.labelY + 56}`)
  })

  it('keeps relationship presentation state out of serialized schema content', () => {
    const result = parseSchemaContentToDraft(denseRelationshipSchemaContent)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const selectedElement = { kind: 'relationship' as const, id: result.draft.relationships[0].id }
    const before = JSON.parse(serializeSchemaDraft(result.draft))

    buildSchemaFlowNodes(result.draft, selectedElement)
    const routedEdges = buildSchemaFlowEdges(result.draft, selectedElement, {
      [result.draft.relationships[0].id]: {
        sourceNodeId: result.draft.relationships[0].fromNodeId,
        targetNodeId: result.draft.relationships[0].toNodeId,
        sourceHandle: 'source-bottom-80',
        targetHandle: 'target-top-20',
      },
    })

    const after = JSON.parse(serializeSchemaDraft(result.draft))
    expect(routedEdges[0].sourceHandle).toBe('source-bottom-80')
    expect(routedEdges[0].targetHandle).toBe('target-top-20')
    expect(after).toEqual(before)
    expect(JSON.stringify(after)).not.toContain('labelOffset')
    expect(JSON.stringify(after)).not.toContain('source-bottom-80')
    expect(JSON.stringify(after)).not.toContain('isRelationshipEndpoint')
  })
})
