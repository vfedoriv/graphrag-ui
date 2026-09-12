import { createElement, StrictMode } from 'react'
import * as xyflow from '@xyflow/react'
import type { Connection, ReactFlowProps } from '@xyflow/react'
import type { SchemaFlowEdge, SchemaFlowNode } from './schemaBuilderFlow'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
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
  relationships: [
    {
      type: 'HAS_PARTY',
      from: 'Contract',
      to: 'Party',
      description: 'Links a contract to a participating party.',
      properties: [
        { name: 'role', type: 'string', required: true },
        { name: 'significance', type: 'number', required: false },
        { name: 'effectiveDate', type: 'date', required: false },
        { name: 'source', type: 'string', required: false },
        { name: 'confidence', type: 'number', required: false },
      ],
    },
  ],
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

  it('keeps a long relationship inspector accessible and editable', async () => {
    const user = userEvent.setup()
    renderBuilder('/schema-builder?schemaId=schema-1')

    await user.click(await screen.findByRole('button', { name: 'Select relationship HAS_PARTY' }))

    const inspector = screen.getByTestId('schema-builder-sidebar')
    expect(inspector).toHaveAttribute('aria-label', 'Schema builder inspector')
    expect(inspector).toHaveAttribute('tabindex', '0')
    expect(within(inspector).getByLabelText('Description', { selector: '#schema-builder-relationship-description' })).toHaveClass(
      'schema-builder-description',
    )

    const propertyGroup = within(inspector).getByRole('group', { name: 'Relationship properties' })
    const propertyNames = within(propertyGroup).getAllByLabelText('Relationship properties name')
    const propertyTypes = within(propertyGroup).getAllByLabelText('Relationship properties type')
    const requiredControls = within(propertyGroup).getAllByRole('checkbox', { name: 'Required' })
    expect(propertyNames).toHaveLength(5)
    expect(propertyTypes).toHaveLength(5)
    expect(requiredControls).toHaveLength(5)
    expect(within(propertyGroup).getAllByRole('button', { name: 'Remove' })).toHaveLength(5)

    await user.clear(propertyNames[0])
    await user.type(propertyNames[0], 'participationRole')
    await user.selectOptions(propertyTypes[1], 'integer')
    await user.click(requiredControls[1])

    await user.click(screen.getByRole('button', { name: 'Raw View' }))
    const serializedSchema = JSON.parse((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value)
    expect(serializedSchema.relationships[0].properties).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'participationRole', type: 'string', required: true }),
      expect.objectContaining({ name: 'significance', type: 'integer', required: true }),
    ]))
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

  describe('element interaction synchronization', () => {
    let canvas: ReactFlowProps<SchemaFlowNode, SchemaFlowEdge>

    beforeEach(() => {
      // Keep the shared canvas double, capturing only its public controlled props.
      // jsdom cannot perform React Flow's pointer/geometry-based reconnection gesture.
      const renderFlow = xyflow.ReactFlow
      vi.spyOn(xyflow, 'ReactFlow').mockImplementation((props) => {
        canvas = props as ReactFlowProps<SchemaFlowNode, SchemaFlowEdge>
        return createElement(renderFlow, props)
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    function readSchema() {
      return JSON.parse((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value)
    }

    function expectNoSelection() {
      expect(screen.getByText('Select a node or relationship on the canvas to edit its fields.')).toBeInTheDocument()
      expect(screen.queryByLabelText('Label')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('From node')).not.toBeInTheDocument()
      expect(canvas.nodes?.some((node) => node.selected || node.data.isRelationshipEndpoint)).toBe(false)
      expect(canvas.edges?.some((edge) => edge.selected)).toBe(false)
    }

    async function removeSelected(user: ReturnType<typeof userEvent.setup>) {
      const heading = screen.getByRole('heading', { name: /^(Node|Relationship)$/ })
      await user.click(within(heading.parentElement!).getByRole('button', { name: 'Remove' }))
    }

    it('adds and removes nodes and relationships with synchronized defaults and cleared inspectors', async () => {
      const user = userEvent.setup()
      renderBuilder()
      await user.click(screen.getByRole('button', { name: 'Raw View' }))
      expectNoSelection()
      expect(screen.getByRole('button', { name: 'Add relationship' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Add node' }))
      expect(screen.getByLabelText('Label')).toHaveValue('Node1')
      expect(screen.getByLabelText('Key properties')).toHaveValue('node1Id')
      expect(readSchema().nodes).toEqual([{
        label: 'Node1', key: 'node1Id',
        properties: [{ name: 'node1Id', type: 'string', required: true }],
      }])
      await user.click(screen.getByRole('button', { name: 'Add relationship' }))
      expect(screen.getByLabelText('Type')).toHaveValue('RELATIONSHIP_1')
      expect(screen.getByLabelText('From node')).toHaveDisplayValue('Node1')
      expect(screen.getByLabelText('To node')).toHaveDisplayValue('Node1')
      expect(readSchema().relationships).toEqual([{ type: 'RELATIONSHIP_1', from: 'Node1', to: 'Node1' }])
      await removeSelected(user)
      expectNoSelection()
      expect(readSchema().relationships).toEqual([])
      expect(screen.queryByRole('button', { name: 'Select relationship RELATIONSHIP_1' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Add node' }))
      expect(screen.getByLabelText('Label')).toHaveValue('Node2')
      await user.click(screen.getByRole('button', { name: 'Add relationship' }))
      expect(screen.getByLabelText('From node')).toHaveDisplayValue('Node1')
      expect(screen.getByLabelText('To node')).toHaveDisplayValue('Node2')
      expect(readSchema().relationships).toEqual([{ type: 'RELATIONSHIP_1', from: 'Node1', to: 'Node2' }])
      await user.click(screen.getByRole('button', { name: 'Node2' }))
      expect(screen.queryByLabelText('Type')).not.toBeInTheDocument()
      await removeSelected(user)
      expectNoSelection()
      expect(readSchema().nodes).toHaveLength(1)
      expect(readSchema().relationships).toEqual([])
      expect(screen.queryByRole('button', { name: 'Node2' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Node1' }))
      await removeSelected(user)
      expectNoSelection()
      expect(readSchema().nodes).toEqual([])
      expect(screen.getByRole('button', { name: 'Add relationship' })).toBeDisabled()
    })

    it('connects and reconnects while preserving relationship fields and selecting the updated endpoints', async () => {
      const user = userEvent.setup()
      renderBuilder('/schema-builder?schemaId=schema-1')
      await screen.findByRole('button', { name: 'Contract' })
      await user.click(screen.getByRole('button', { name: 'Raw View' }))
      const imported = readSchema()
      await user.click(screen.getByRole('button', { name: 'Add node' }))
      const [contract, party, added] = canvas.nodes!
      const connection: Connection = {
        source: party.id, target: added.id,
        sourceHandle: 'source-bottom-80', targetHandle: 'target-top-20',
      }
      expect(canvas.isValidConnection!(connection)).toBe(true)
      act(() => canvas.onConnect!(connection))
      expect(screen.getByLabelText('Type')).toHaveValue('RELATIONSHIP_2')
      expect(screen.getByLabelText('From node')).toHaveDisplayValue('Party')
      expect(screen.getByLabelText('To node')).toHaveDisplayValue('Node3')
      expect(readSchema().relationships).toEqual([
        imported.relationships[0], { type: 'RELATIONSHIP_2', from: 'Party', to: 'Node3' },
      ])
      expect(canvas.edges![1]).toMatchObject({ selected: true, ...connection })

      // Reconnect the existing rich relationship, leaving the other edge untouched.
      const oldEdge = canvas.edges![0]
      const reconnect = { ...connection, source: added.id, target: contract.id }
      expect(canvas.isValidConnection!(reconnect)).toBe(true)
      act(() => canvas.onReconnect!(oldEdge, reconnect))
      expect(screen.getByLabelText('Type')).toHaveValue('HAS_PARTY')
      expect(screen.getByLabelText('From node')).toHaveDisplayValue('Node3')
      expect(screen.getByLabelText('To node')).toHaveDisplayValue('Contract')
      expect(screen.getAllByLabelText('Relationship properties name')).toHaveLength(5)
      expect(readSchema().relationships).toEqual([
        { ...imported.relationships[0], from: 'Node3', to: 'Contract' },
        { type: 'RELATIONSHIP_2', from: 'Party', to: 'Node3' },
      ])
      expect(readSchema().indexes).toEqual(imported.indexes)
      expect(canvas.edges![0]).toMatchObject({ id: oldEdge.id, selected: true, ...reconnect })
      expect(canvas.edges![1].selected).toBe(false)
      expect(canvas.nodes!.filter((node) => node.data.isRelationshipEndpoint).map((node) => node.data.label)).toEqual(['Contract', 'Node3'])

      const afterReconnect = readSchema()
      await user.click(screen.getByRole('button', { name: 'Party' }))
      expect(screen.getByLabelText('Label')).toHaveValue('Party')
      expect(screen.queryByLabelText('From node')).not.toBeInTheDocument()
      expect(canvas.nodes!.filter((node) => node.selected).map((node) => node.id)).toEqual([party.id])
      expect(canvas.nodes!.some((node) => node.data.isRelationshipEndpoint)).toBe(false)
      expect(canvas.edges!.some((edge) => edge.selected)).toBe(false)
      act(() => canvas.onEdgeClick!({} as Parameters<NonNullable<typeof canvas.onEdgeClick>>[0], canvas.edges![0]))
      expect(screen.getByLabelText('Type')).toHaveValue('HAS_PARTY')
      expect(screen.queryByLabelText('Label')).not.toBeInTheDocument()
      expect(readSchema()).toEqual(afterReconnect)

      await user.click(screen.getByRole('button', { name: 'Contract' }))
      await removeSelected(user)
      expectNoSelection()
      expect(readSchema().relationships).toEqual([afterReconnect.relationships[1]])
      expect(canvas.edges).toHaveLength(1)
      expect(screen.queryByRole('button', { name: 'Select relationship HAS_PARTY' })).not.toBeInTheDocument()
    })

    it.each([
      ['missing source', '', 'node-party-2'],
      ['missing target', 'node-contract-1', ''],
      ['self connection', 'node-contract-1', 'node-contract-1'],
    ])('rejects %s for both connection and reconnection without changing content or selection', async (_, source, target) => {
      const user = userEvent.setup()
      renderBuilder('/schema-builder?schemaId=schema-1')
      await user.click(await screen.findByRole('button', { name: 'Contract' }))
      await user.click(screen.getByRole('button', { name: 'Raw View' }))
      const before = readSchema()
      const connection: Connection = { source, target, sourceHandle: null, targetHandle: null }
      expect(canvas.isValidConnection!(connection)).toBe(false)
      // Invoke callbacks too: the controller guards must hold even if an invalid event arrives.
      act(() => canvas.onConnect!(connection))
      expect(readSchema()).toEqual(before)
      expect(screen.getByLabelText('Label')).toHaveValue('Contract')
      act(() => canvas.onReconnect!(canvas.edges![0], connection))
      expect(readSchema()).toEqual(before)
      expect(screen.getByLabelText('Label')).toHaveValue('Contract')
      expect(screen.queryByLabelText('From node')).not.toBeInTheDocument()
      expect(canvas.nodes!.filter((node) => node.selected).map((node) => node.data.label)).toEqual(['Contract'])
      expect(canvas.edges).toHaveLength(1)
      expect(canvas.edges![0].selected).toBe(false)
    })
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
