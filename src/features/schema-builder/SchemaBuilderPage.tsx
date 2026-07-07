import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type EdgeProps,
  type EdgeMouseHandler,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSearchParams } from 'react-router-dom'
import {
  useCreateSchemaMutation,
  useGetSchemaMutation,
  useSchemasByKnowledgeBaseQuery,
  useUpdateSchemaMutation,
  useValidateSchemaMutation,
} from '../../api/schemas'
import type { SchemaDetails } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { Input } from '../../shared/ui/Input'
import { ProgressBanner } from '../../shared/ui/ProgressBanner'
import { WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import { SchemaJsonEditor } from '../../shared/ui/SchemaJsonEditor'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import {
  createBlankSchemaDraft,
  makeNodeDraft,
  makePropertyDraft,
  makeRelationshipDraft,
  parseSchemaContentToDraft,
  serializeSchemaDraft,
  validateSchemaBuilderDraft,
} from './schemaBuilderMapping'
import {
  buildSchemaFlowEdges,
  buildSchemaFlowNodes,
  relationshipLabelOffsetPattern,
  routeRelationshipPath,
  schemaRelationshipHandlePercents,
  type RelationshipRouteOverride,
  type SchemaFlowEdge,
  type SchemaFlowNode,
  type SelectedElement,
} from './schemaBuilderFlow'
import type {
  SchemaBuilderDraft,
  SchemaNodeDraft,
  SchemaPropertyDraft,
  SchemaRelationshipDraft,
} from './schemaBuilderTypes'
import { SCHEMA_BUILDER_DRAFT_STORAGE_KEY } from './schemaBuilderStorage'

const nodeTypes = {
  schemaNode: SchemaNodeCard,
}

const edgeTypes = {
  schemaRelationship: SchemaRelationshipEdge,
}

export function SchemaBuilderPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: schemas = [] } = useSchemasByKnowledgeBaseQuery(selectedKnowledgeBaseId)
  const getSchemaMutation = useGetSchemaMutation()
  const validateMutation = useValidateSchemaMutation()
  const createMutation = useCreateSchemaMutation()
  const updateMutation = useUpdateSchemaMutation()
  const [draft, setDraft] = useState<SchemaBuilderDraft>(() => createBlankSchemaDraft())
  const [rawJson, setRawJson] = useState(() => serializeSchemaDraft(createBlankSchemaDraft()))
  const [rawParseError, setRawParseError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null)
  const [relationshipRouteOverrides, setRelationshipRouteOverrides] = useState<Record<string, RelationshipRouteOverride>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [schemaSelectValue, setSchemaSelectValue] = useState('')
  const initialLoadKeyRef = useRef('')

  const selectedSchemaId = draft.sourceSchemaId
  const routeSchemaId = searchParams.get('schemaId') ?? ''
  const importSelectValue = schemaSelectValue || routeSchemaId
  const hasImportOption = Boolean(importSelectValue) && schemas.some((schema) => schema.id === importSelectValue)
  const localIssues = useMemo(() => validateSchemaBuilderDraft(draft, rawParseError), [draft, rawParseError])
  const isDraftSubmittable = localIssues.length === 0
  const isAnyPending =
    getSchemaMutation.isPending ||
    validateMutation.isPending ||
    createMutation.isPending ||
    updateMutation.isPending

  const replaceDraft = useCallback((nextDraft: SchemaBuilderDraft) => {
    setDraft(nextDraft)
    setRawJson(serializeSchemaDraft(nextDraft))
    setRawParseError(null)
    setSelectedElement(null)
    setRelationshipRouteOverrides({})
    setSuccessMessage('')
  }, [])

  const visualNodes = useMemo<SchemaFlowNode[]>(
    () => buildSchemaFlowNodes(draft, selectedElement),
    [draft, selectedElement],
  )

  const visualEdges = useMemo<SchemaFlowEdge[]>(
    () =>
      buildSchemaFlowEdges(draft, selectedElement, relationshipRouteOverrides).map((edge) => ({
        ...edge,
        data: edge.data
          ? {
              ...edge.data,
              onSelectRelationship: (relationshipId: string) => setSelectedElement({ kind: 'relationship', id: relationshipId }),
            }
          : edge.data,
      })),
    [draft, relationshipRouteOverrides, selectedElement],
  )

  const importSchemaDetails = useCallback((details: SchemaDetails) => {
    const result = parseSchemaContentToDraft(details.content, { schemaId: details.id, sourceType: details.sourceType })
    if (result.ok) {
      replaceDraft(result.draft)
      setSchemaSelectValue(details.id)
    } else {
      setRawJson(details.content)
      setRawParseError(result.error)
    }
  }, [replaceDraft])

  const loadSchemaById = useCallback(async (schemaId: string) => {
    setSuccessMessage('')
    getSchemaMutation.reset()
    try {
      const details = await getSchemaMutation.mutateAsync(schemaId)
      importSchemaDetails(details)
    } catch {
      // surfaced by mutation error
    }
  }, [getSchemaMutation, importSchemaDetails])

  const importRawContent = useCallback((content: string) => {
    const result = parseSchemaContentToDraft(content)
    if (result.ok) {
      replaceDraft(result.draft)
    } else {
      setRawJson(content)
      setRawParseError(result.error)
      setSuccessMessage('')
    }
  }, [replaceDraft])

  useEffect(() => {
    const schemaId = searchParams.get('schemaId')
    const draftSource = searchParams.get('draft')
    const key = `${schemaId ?? ''}:${draftSource ?? ''}`
    if (key === initialLoadKeyRef.current) return

    if (schemaId) {
      const timeout = window.setTimeout(() => {
        initialLoadKeyRef.current = key
        void loadSchemaById(schemaId)
      }, 0)
      return () => window.clearTimeout(timeout)
    }

    if (draftSource === 'session') {
      const timeout = window.setTimeout(() => {
        initialLoadKeyRef.current = key
        const storedDraft = sessionStorage.getItem(SCHEMA_BUILDER_DRAFT_STORAGE_KEY)
        if (storedDraft) {
          importRawContent(storedDraft)
        }
      }, 0)
      return () => window.clearTimeout(timeout)
    }
  }, [importRawContent, loadSchemaById, searchParams])

  function updateDraft(updater: (current: SchemaBuilderDraft) => SchemaBuilderDraft) {
    setDraft((current) => {
      const nextDraft = updater(current)
      setRawJson(serializeSchemaDraft(nextDraft))
      setRawParseError(null)
      setSuccessMessage('')
      return nextDraft
    })
  }

  function updateRawJson(nextValue: string) {
    setRawJson(nextValue)
    setSuccessMessage('')
    const result = parseSchemaContentToDraft(nextValue, { schemaId: draft.sourceSchemaId, sourceType: draft.sourceType })
    if (result.ok) {
      setDraft(result.draft)
      setRawParseError(null)
      setRelationshipRouteOverrides({})
    } else {
      setRawParseError(result.error)
    }
  }

  function addNode() {
    updateDraft((current) => {
      const nextIndex = current.nodes.length
      const nextNumber = nextIndex + 1
      const property = makePropertyDraft(0, {
        id: uniqueDraftId('property', current),
        name: `node${nextNumber}Id`,
        type: 'string',
        required: true,
      })
      const node = makeNodeDraft(nextIndex, {
        id: uniqueDraftId('node', current),
        label: `Node${nextNumber}`,
        key: [property.name],
        properties: [property],
      })
      setSelectedElement({ kind: 'node', id: node.id })
      return { ...current, nodes: [...current.nodes, node] }
    })
  }

  function removeNode(nodeId: string) {
    updateDraft((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== nodeId),
      relationships: current.relationships.filter((relationship) => relationship.fromNodeId !== nodeId && relationship.toNodeId !== nodeId),
    }))
    setSelectedElement(null)
  }

  function addRelationship(fromNodeId?: string, toNodeId?: string, routeOverride?: Omit<RelationshipRouteOverride, 'sourceNodeId' | 'targetNodeId'>) {
    updateDraft((current) => {
      const [firstNode, secondNode] = current.nodes
      const sourceNodeId = fromNodeId ?? firstNode?.id ?? ''
      const targetNodeId = toNodeId ?? secondNode?.id ?? firstNode?.id ?? ''
      const relationship = makeRelationshipDraft(current.relationships.length, {
        id: uniqueDraftId('relationship', current),
        type: `RELATIONSHIP_${current.relationships.length + 1}`,
        fromNodeId: sourceNodeId,
        toNodeId: targetNodeId,
      })
      if (routeOverride && sourceNodeId && targetNodeId) {
        setRelationshipRouteOverrides((currentOverrides) => ({
          ...currentOverrides,
          [relationship.id]: {
            sourceNodeId,
            targetNodeId,
            sourceHandle: routeOverride.sourceHandle,
            targetHandle: routeOverride.targetHandle,
          },
        }))
      }
      setSelectedElement({ kind: 'relationship', id: relationship.id })
      return { ...current, relationships: [...current.relationships, relationship] }
    })
  }

  function removeRelationship(relationshipId: string) {
    updateDraft((current) => ({
      ...current,
      relationships: current.relationships.filter((relationship) => relationship.id !== relationshipId),
    }))
    setSelectedElement(null)
  }

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return
    addRelationship(connection.source, connection.target, {
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    })
  }

  const onReconnect = (oldEdge: SchemaFlowEdge, connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return
    updateDraft((current) => ({
      ...current,
      relationships: current.relationships.map((relationship) =>
        relationship.id === oldEdge.id
          ? {
              ...relationship,
              fromNodeId: connection.source,
              toNodeId: connection.target,
            }
          : relationship,
      ),
    }))
    setRelationshipRouteOverrides((currentOverrides) => ({
      ...currentOverrides,
      [oldEdge.id]: {
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      },
    }))
    setSelectedElement({ kind: 'relationship', id: oldEdge.id })
  }

  const onNodeClick: NodeMouseHandler<SchemaFlowNode> = (_, node) => {
    setSelectedElement({ kind: 'node', id: node.id })
  }

  const onEdgeClick: EdgeMouseHandler<SchemaFlowEdge> = (_, edge) => {
    setSelectedElement({ kind: 'relationship', id: edge.id })
  }

  const onNodeDragStop = (_: MouseEvent | TouchEvent, node: SchemaFlowNode) => {
    updateDraft((current) => ({
      ...current,
      nodes: current.nodes.map((draftNode) =>
        draftNode.id === node.id ? { ...draftNode, position: node.position } : draftNode,
      ),
    }))
  }

  async function validateDraft() {
    validateMutation.reset()
    try {
      await validateMutation.mutateAsync({ content: rawJson })
    } catch {
      // surfaced by mutation error
    }
  }

  async function createSchema() {
    createMutation.reset()
    try {
      const created = await createMutation.mutateAsync({
        knowledgeBaseId: selectedKnowledgeBaseId,
        payload: {
          content: rawJson,
          sourceType: 'PREDEFINED',
          ...(selectedKnowledgeBaseId ? { knowledgeBaseId: selectedKnowledgeBaseId } : {}),
        },
      })
      setSuccessMessage(`Schema ${created.name} v${created.version} created.`)
    } catch {
      // surfaced by mutation error
    }
  }

  async function updateSchema() {
    if (!selectedSchemaId) return
    updateMutation.reset()
    try {
      const updated = await updateMutation.mutateAsync({
        schemaId: selectedSchemaId,
        knowledgeBaseId: selectedKnowledgeBaseId,
        payload: {
          content: rawJson,
          sourceType: draft.sourceType === 'GENERATED' || draft.sourceType === 'PREDEFINED' ? draft.sourceType : 'PREDEFINED',
        },
      })
      setSuccessMessage(`Schema ${updated.name} v${updated.version} updated.`)
    } catch {
      // surfaced by mutation error
    }
  }

  const topSection = (
    <div className='schema-builder-layout'>
      <div className='schema-builder-main stack'>
        {isAnyPending ? <ProgressBanner message='Waiting for schema builder workflow response...' /> : null}
        <div className='schema-builder-toolbar'>
          <Button
            type='button'
            onClick={() => {
              replaceDraft(createBlankSchemaDraft())
              setSchemaSelectValue('')
              setSearchParams({})
            }}
            disabled={isAnyPending}
          >
            Blank draft
          </Button>
          <label className='schema-builder-import'>
            <span className='field-label'>Import existing schema</span>
            <select
              aria-label='Import existing schema'
              value={importSelectValue}
              disabled={isAnyPending || schemas.length === 0}
              onChange={(event) => {
                const schemaId = event.target.value
                setSchemaSelectValue(schemaId)
                if (schemaId) {
                  setSearchParams({ schemaId })
                  void loadSchemaById(schemaId)
                }
              }}
            >
              <option value=''>Select schema</option>
              {importSelectValue && !hasImportOption ? (
                <option value={importSelectValue}>Selected schema ({importSelectValue})</option>
              ) : null}
              {schemas.map((schema) => (
                <option key={schema.id} value={schema.id}>
                  {schema.name} v{schema.version}
                </option>
              ))}
            </select>
          </label>
          <Button type='button' variant='primary' onClick={() => void validateDraft()} disabled={!isDraftSubmittable || isAnyPending}>
            Validate
          </Button>
          <Button type='button' variant='primary' onClick={() => void createSchema()} disabled={!isDraftSubmittable || isAnyPending}>
            Create schema
          </Button>
          <Button type='button' onClick={() => void updateSchema()} disabled={!selectedSchemaId || !isDraftSubmittable || isAnyPending}>
            Update source
          </Button>
        </div>

        <div className='schema-builder-canvas' data-testid='schema-builder-canvas'>
          <ReactFlow<SchemaFlowNode, SchemaFlowEdge>
            nodes={visualNodes}
            edges={visualEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeDragStop={onNodeDragStop}
            edgesReconnectable
            reconnectRadius={14}
            isValidConnection={(connection) => Boolean(connection.source && connection.target && connection.source !== connection.target)}
            fitView
          >
            <MiniMap pannable zoomable />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        <div className='toolbar'>
          <Button type='button' variant='primary' onClick={addNode}>
            Add node
          </Button>
          <Button type='button' onClick={() => addRelationship()} disabled={draft.nodes.length === 0}>
            Add relationship
          </Button>
        </div>

        <BuilderFeedback
          issues={localIssues}
          rawParseError={rawParseError}
          validateError={validateMutation.error}
          validationData={validateMutation.data}
          createError={createMutation.error}
          updateError={updateMutation.error}
          getError={getSchemaMutation.error}
          successMessage={successMessage}
        />
      </div>

      <aside className='schema-builder-sidebar stack'>
        <SchemaMetadataEditor draft={draft} onChange={updateDraft} />
        <SchemaElementInspector
          draft={draft}
          selectedElement={selectedElement}
          onChange={updateDraft}
          onRemoveNode={removeNode}
          onRemoveRelationship={removeRelationship}
        />
        <RuntimeContextSummary
          knowledgeBaseId={selectedKnowledgeBaseId}
          settingHints={['schema', 'builder']}
          title='Builder context'
        />
      </aside>
    </div>
  )

  const tabs = (
    <div className='stack'>
      <div className='panel-head compact'>
        <div>
          <h3>Schema JSON</h3>
          <p>Visual edits serialize here; valid raw edits update the visual builder.</p>
        </div>
        <StatusBadge label={rawParseError ? 'Invalid JSON' : 'JSON synced'} tone={rawParseError ? 'error' : 'success'} />
      </div>
      <SchemaJsonEditor
        id='schema-builder-json'
        label='Schema builder JSON content'
        value={rawJson}
        onChange={updateRawJson}
        placeholder='Schema JSON content'
        disabled={isAnyPending}
        minHeight={360}
      />
    </div>
  )

  return (
    <ControllerPage
      title='Schema Builder'
      eyebrow='Visual schema workspace'
      description='Build graph schema nodes, relationships, and properties visually while preserving the existing schema JSON contract.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Workspace', value: selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'Nodes', value: String(draft.nodes.length) },
            { label: 'Relationships', value: String(draft.relationships.length) },
            { label: 'Source schema', value: selectedSchemaId ?? 'Unsaved draft', tone: selectedSchemaId ? 'success' : 'warning' },
          ]}
        />
      }
      topSectionTitle='Visual builder'
      topSectionDescription='Canvas edits and inspector changes stay synchronized with schema JSON.'
      topSectionStatus={<StatusBadge label={isDraftSubmittable ? 'Draft ready' : 'Needs attention'} tone={isDraftSubmittable ? 'success' : 'warning'} />}
      topSection={topSection}
      tabs={tabs}
      tabsTitle='Raw JSON contract'
      tabsDescription='Use advanced JSON for indexes, vector indexes, and fields outside the first-class visual editor.'
      testId='schema-builder-page'
    />
  )
}

function SchemaNodeCard({ data, selected, isConnectable }: NodeProps<SchemaFlowNode>) {
  return (
    <div
      className='schema-flow-node'
      data-selected={selected ? 'true' : undefined}
      data-relationship-endpoint={data.isRelationshipEndpoint ? 'true' : undefined}
    >
      <SchemaNodeRoutingHandles isConnectable={isConnectable} />
      <Handle id='target-left' type='target' position={Position.Left} isConnectable={isConnectable} />
      <strong>{data.label}</strong>
      <small>{data.key.length > 0 ? `Key: ${data.key.join(', ')}` : 'No key set'}</small>
      <small>{data.propertyCount} properties</small>
      <Handle id='source-right' type='source' position={Position.Right} isConnectable={isConnectable} />
    </div>
  )
}

const schemaNodeHandleSides = ['left', 'right', 'top', 'bottom'] as const

function SchemaNodeRoutingHandles({ isConnectable }: { isConnectable: boolean }) {
  return (
    <>
      {schemaNodeHandleSides.flatMap((side) =>
        schemaRelationshipHandlePercents.flatMap((percent) => [
          <Handle
            key={`target-${side}-${percent}`}
            id={`target-${side}-${percent}`}
            type='target'
            position={positionForHandleSide(side)}
            isConnectable={isConnectable}
            className='schema-flow-handle-aux'
            style={styleForHandleSide(side, percent)}
          />,
          <Handle
            key={`source-${side}-${percent}`}
            id={`source-${side}-${percent}`}
            type='source'
            position={positionForHandleSide(side)}
            isConnectable={isConnectable}
            className='schema-flow-handle-aux'
            style={styleForHandleSide(side, percent)}
          />,
        ]),
      )}
    </>
  )
}

function positionForHandleSide(side: (typeof schemaNodeHandleSides)[number]) {
  if (side === 'left') return Position.Left
  if (side === 'right') return Position.Right
  if (side === 'top') return Position.Top
  return Position.Bottom
}

function styleForHandleSide(side: (typeof schemaNodeHandleSides)[number], percent: number) {
  if (side === 'left' || side === 'right') {
    return { top: `${percent}%` }
  }
  return { left: `${percent}%` }
}

function SchemaRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<SchemaFlowEdge>) {
  const isSelected = selected || data?.isSelected
  const labelOffset = data?.labelOffset ?? relationshipLabelOffsetPattern[0]
  const { path: edgePath, labelX, labelY, labelLeaderPath } = routeRelationshipPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    route: data?.route,
    label: data?.label,
    labelOffset,
  })
  const labelSide = labelOffset.y > 0 ? 'below' : 'above'
  const edgeColor = isSelected ? '#2563eb' : '#52616f'

  return (
    <>
      {labelLeaderPath ? (
        <path
          className='schema-flow-edge-label-leader'
          d={labelLeaderPath}
          stroke={edgeColor}
          strokeWidth={isSelected ? 1.4 : 1}
          fill='none'
        />
      ) : null}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: isSelected ? 3 : 1.8,
        }}
      />
      <EdgeLabelRenderer>
        <div
          role='button'
          tabIndex={0}
          aria-label={`Select relationship ${data?.label ?? id}`}
          className='schema-flow-edge-label nodrag nopan'
          data-selected={isSelected ? 'true' : undefined}
          data-side={labelSide}
          data-testid={`schema-flow-edge-label-${data?.relationshipId ?? id}`}
          onClick={() => {
            if (data?.relationshipId) {
              data.onSelectRelationship?.(data.relationshipId)
            }
          }}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && data?.relationshipId) {
              event.preventDefault()
              data.onSelectRelationship?.(data.relationshipId)
            }
          }}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX + labelOffset.x}px,${labelY + labelOffset.y}px)`,
            zIndex: isSelected ? 50 : 40,
          }}
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function SchemaMetadataEditor({
  draft,
  onChange,
}: {
  draft: SchemaBuilderDraft
  onChange: (updater: (current: SchemaBuilderDraft) => SchemaBuilderDraft) => void
}) {
  return (
    <div className='flow-card'>
      <h3>Schema metadata</h3>
      <FieldLabel htmlFor='schema-builder-name'>Name</FieldLabel>
      <Input
        id='schema-builder-name'
        value={draft.name}
        onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
      />
      <FieldLabel htmlFor='schema-builder-version'>Version</FieldLabel>
      <Input
        id='schema-builder-version'
        type='number'
        min={1}
        value={draft.version}
        onChange={(event) => onChange((current) => ({ ...current, version: Number(event.target.value) }))}
      />
      <FieldLabel htmlFor='schema-builder-description'>Description</FieldLabel>
      <textarea
        id='schema-builder-description'
        rows={3}
        value={draft.description}
        onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
      />
    </div>
  )
}

function SchemaElementInspector({
  draft,
  selectedElement,
  onChange,
  onRemoveNode,
  onRemoveRelationship,
}: {
  draft: SchemaBuilderDraft
  selectedElement: SelectedElement
  onChange: (updater: (current: SchemaBuilderDraft) => SchemaBuilderDraft) => void
  onRemoveNode: (nodeId: string) => void
  onRemoveRelationship: (relationshipId: string) => void
}) {
  if (!selectedElement) {
    return (
      <div className='flow-card'>
        <h3>Element inspector</h3>
        <p>Select a node or relationship on the canvas to edit its fields.</p>
      </div>
    )
  }

  if (selectedElement.kind === 'node') {
    const node = draft.nodes.find((item) => item.id === selectedElement.id)
    if (!node) return null
    return (
      <NodeInspector
        node={node}
        onChange={(nextNode) =>
          onChange((current) => ({
            ...current,
            nodes: current.nodes.map((item) => (item.id === nextNode.id ? nextNode : item)),
          }))
        }
        onRemove={() => onRemoveNode(node.id)}
      />
    )
  }

  const relationship = draft.relationships.find((item) => item.id === selectedElement.id)
  if (!relationship) return null
  return (
    <RelationshipInspector
      relationship={relationship}
      nodes={draft.nodes}
      onChange={(nextRelationship) =>
        onChange((current) => ({
          ...current,
          relationships: current.relationships.map((item) => (item.id === nextRelationship.id ? nextRelationship : item)),
        }))
      }
      onRemove={() => onRemoveRelationship(relationship.id)}
    />
  )
}

function NodeInspector({
  node,
  onChange,
  onRemove,
}: {
  node: SchemaNodeDraft
  onChange: (node: SchemaNodeDraft) => void
  onRemove: () => void
}) {
  return (
    <div className='flow-card'>
      <div className='split-stack'>
        <h3>Node</h3>
        <Button type='button' variant='danger' onClick={onRemove}>
          Remove
        </Button>
      </div>
      <FieldLabel htmlFor='schema-builder-node-label'>Label</FieldLabel>
      <Input id='schema-builder-node-label' value={node.label} onChange={(event) => onChange({ ...node, label: event.target.value })} />
      <FieldLabel htmlFor='schema-builder-node-description'>Description</FieldLabel>
      <textarea
        id='schema-builder-node-description'
        rows={3}
        value={node.description}
        onChange={(event) => onChange({ ...node, description: event.target.value })}
      />
      <FieldLabel htmlFor='schema-builder-node-key'>Key properties</FieldLabel>
      <Input
        id='schema-builder-node-key'
        value={node.key.join(', ')}
        onChange={(event) => onChange({ ...node, key: splitCsv(event.target.value) })}
      />
      <PropertyEditor
        ownerLabel='Node properties'
        properties={node.properties}
        onChange={(properties) => onChange({ ...node, properties })}
      />
    </div>
  )
}

function RelationshipInspector({
  relationship,
  nodes,
  onChange,
  onRemove,
}: {
  relationship: SchemaRelationshipDraft
  nodes: SchemaNodeDraft[]
  onChange: (relationship: SchemaRelationshipDraft) => void
  onRemove: () => void
}) {
  return (
    <div className='flow-card'>
      <div className='split-stack'>
        <h3>Relationship</h3>
        <Button type='button' variant='danger' onClick={onRemove}>
          Remove
        </Button>
      </div>
      <FieldLabel htmlFor='schema-builder-relationship-type'>Type</FieldLabel>
      <Input
        id='schema-builder-relationship-type'
        value={relationship.type}
        onChange={(event) => onChange({ ...relationship, type: event.target.value })}
      />
      <FieldLabel htmlFor='schema-builder-relationship-from'>From node</FieldLabel>
      <select
        id='schema-builder-relationship-from'
        value={relationship.fromNodeId}
        onChange={(event) => onChange({ ...relationship, fromNodeId: event.target.value })}
      >
        <option value=''>Select node</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.label || node.id}
          </option>
        ))}
      </select>
      <FieldLabel htmlFor='schema-builder-relationship-to'>To node</FieldLabel>
      <select
        id='schema-builder-relationship-to'
        value={relationship.toNodeId}
        onChange={(event) => onChange({ ...relationship, toNodeId: event.target.value })}
      >
        <option value=''>Select node</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.label || node.id}
          </option>
        ))}
      </select>
      <FieldLabel htmlFor='schema-builder-relationship-description'>Description</FieldLabel>
      <textarea
        id='schema-builder-relationship-description'
        rows={3}
        value={relationship.description}
        onChange={(event) => onChange({ ...relationship, description: event.target.value })}
      />
      <PropertyEditor
        ownerLabel='Relationship properties'
        properties={relationship.properties}
        onChange={(properties) => onChange({ ...relationship, properties })}
      />
    </div>
  )
}

function PropertyEditor({
  ownerLabel,
  properties,
  onChange,
}: {
  ownerLabel: string
  properties: SchemaPropertyDraft[]
  onChange: (properties: SchemaPropertyDraft[]) => void
}) {
  return (
    <div className='stack'>
      <div className='split-stack'>
        <h4>{ownerLabel}</h4>
        <Button
          type='button'
          onClick={() => onChange([...properties, makePropertyDraft(properties.length, { id: `property-${Date.now()}` })])}
        >
          Add property
        </Button>
      </div>
      {properties.length === 0 ? <p>No properties yet.</p> : null}
      {properties.map((property) => (
        <div className='schema-property-row' key={property.id}>
          <Input
            aria-label={`${ownerLabel} name`}
            value={property.name}
            placeholder='name'
            onChange={(event) =>
              onChange(properties.map((item) => (item.id === property.id ? { ...item, name: event.target.value } : item)))
            }
          />
          <select
            aria-label={`${ownerLabel} type`}
            value={property.type}
            onChange={(event) =>
              onChange(properties.map((item) => (item.id === property.id ? { ...item, type: event.target.value } : item)))
            }
          >
            {['string', 'number', 'integer', 'boolean', 'date', 'datetime'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <label className='check-row compact-check'>
            <input
              type='checkbox'
              checked={property.required}
              onChange={(event) =>
                onChange(properties.map((item) => (item.id === property.id ? { ...item, required: event.target.checked } : item)))
              }
            />
            Required
          </label>
          <Button type='button' variant='ghost' onClick={() => onChange(properties.filter((item) => item.id !== property.id))}>
            Remove
          </Button>
        </div>
      ))}
    </div>
  )
}

function BuilderFeedback({
  issues,
  rawParseError,
  validateError,
  validationData,
  createError,
  updateError,
  getError,
  successMessage,
}: {
  issues: { path: string; message: string }[]
  rawParseError: string | null
  validateError: Error | null
  validationData?: { valid: boolean; errors: string[] }
  createError: Error | null
  updateError: Error | null
  getError: Error | null
  successMessage: string
}) {
  return (
    <div className='stack'>
      {rawParseError ? <Alert title='JSON parse error' message={rawParseError} /> : null}
      {issues.length > 0 && !rawParseError ? (
        <Alert title='Draft needs attention' message={issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')} tone='info' />
      ) : null}
      {validationData ? (
        validationData.errors.length === 0 ? (
          <StatusBadge label='Schema is valid.' tone='success' />
        ) : (
          <Alert title='Schema validation errors' message={validationData.errors.join('; ')} />
        )
      ) : null}
      {successMessage ? <StatusBadge label={successMessage} tone='success' /> : null}
      {getError ? <Alert title='Import failed' message={getError.message} /> : null}
      {validateError ? <Alert title='Validate failed' message={validateError.message} /> : null}
      {createError ? <Alert title='Create failed' message={createError.message} /> : null}
      {updateError ? <Alert title='Update failed' message={updateError.message} /> : null}
    </div>
  )
}

function uniqueDraftId(prefix: 'node' | 'relationship' | 'property', draft: SchemaBuilderDraft) {
  const existingIds = new Set([
    ...draft.nodes.map((node) => node.id),
    ...draft.relationships.map((relationship) => relationship.id),
    ...draft.nodes.flatMap((node) => node.properties.map((property) => property.id)),
    ...draft.relationships.flatMap((relationship) => relationship.properties.map((property) => property.id)),
  ])
  let index = existingIds.size + 1
  let id = `${prefix}-${index}`
  while (existingIds.has(id)) {
    index += 1
    id = `${prefix}-${index}`
  }
  return id
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
