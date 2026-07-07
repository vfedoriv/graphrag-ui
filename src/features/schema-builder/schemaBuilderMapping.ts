import type {
  SchemaBuilderDraft,
  SchemaBuilderValidationIssue,
  SchemaNodeDraft,
  SchemaPropertyDraft,
  SchemaRelationshipDraft,
} from './schemaBuilderTypes'

type SchemaJsonDocument = {
  name?: unknown
  version?: unknown
  description?: unknown
  nodes?: unknown
  relationships?: unknown
  [key: string]: unknown
}

const KNOWN_TOP_LEVEL_FIELDS = new Set(['name', 'version', 'description', 'nodes', 'relationships'])
const IMPORT_LAYOUT_X = 430
const IMPORT_LAYOUT_Y = 230
const IMPORT_LAYOUT_START_X = 80
const IMPORT_LAYOUT_START_Y = 80
const IMPORT_LAYOUT_COMPONENT_GAP = 360
const IMPORT_LAYOUT_HUB_DEGREE = 4

export function createBlankSchemaDraft(): SchemaBuilderDraft {
  return {
    name: '',
    version: 1,
    description: '',
    nodes: [],
    relationships: [],
    advancedFields: {},
  }
}

export function parseSchemaContentToDraft(
  content: string,
  source?: { schemaId?: string; sourceType?: string },
): { ok: true; draft: SchemaBuilderDraft } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(content) as unknown
    if (!isRecord(parsed)) {
      return { ok: false, error: 'Schema JSON must be an object.' }
    }
    return { ok: true, draft: schemaDocumentToDraft(parsed as SchemaJsonDocument, source) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Schema JSON could not be parsed.' }
  }
}

export function schemaDocumentToDraft(
  document: SchemaJsonDocument,
  source?: { schemaId?: string; sourceType?: string },
): SchemaBuilderDraft {
  const nodes = Array.isArray(document.nodes) ? document.nodes : []
  const draftNodes = nodes.map((node, index) => toNodeDraft(node, index))
  const nodeIdsByLabel = new Map(draftNodes.map((node) => [node.label, node.id]))
  const relationships = Array.isArray(document.relationships) ? document.relationships : []
  const draftRelationships = relationships.map((relationship, index) => toRelationshipDraft(relationship, index, nodeIdsByLabel))
  const positionedNodes = layoutImportedNodes(draftNodes, draftRelationships)
  const advancedFields = Object.fromEntries(
    Object.entries(document).filter(([key]) => !KNOWN_TOP_LEVEL_FIELDS.has(key)),
  )

  return {
    name: typeof document.name === 'string' ? document.name : '',
    version: typeof document.version === 'number' ? document.version : Number(document.version) || 1,
    description: typeof document.description === 'string' ? document.description : '',
    nodes: positionedNodes,
    relationships: draftRelationships,
    advancedFields,
    sourceSchemaId: source?.schemaId,
    sourceType: source?.sourceType,
  }
}

function layoutImportedNodes(nodes: SchemaNodeDraft[], relationships: SchemaRelationshipDraft[]) {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  const adjacent = new Map<string, string[]>()
  nodes.forEach((node) => {
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
    adjacent.set(node.id, [])
  })
  relationships.forEach((relationship) => {
    if (
      relationship.fromNodeId &&
      relationship.toNodeId &&
      relationship.fromNodeId !== relationship.toNodeId &&
      nodeIds.has(relationship.fromNodeId) &&
      nodeIds.has(relationship.toNodeId)
    ) {
      outgoing.get(relationship.fromNodeId)?.push(relationship.toNodeId)
      incoming.get(relationship.toNodeId)?.push(relationship.fromNodeId)
      adjacent.get(relationship.fromNodeId)?.push(relationship.toNodeId)
      adjacent.get(relationship.toNodeId)?.push(relationship.fromNodeId)
    }
  })
  const components = connectedNodeComponents(nodes, adjacent)
  const positions = new Map<string, { x: number; y: number }>()
  let nextComponentY = IMPORT_LAYOUT_START_Y

  components.forEach((component) => {
    const componentPositions = layoutImportedComponent(component, { outgoing, incoming, adjacent }, nextComponentY)
    let maxY = nextComponentY
    componentPositions.forEach((position, nodeId) => {
      positions.set(nodeId, position)
      maxY = Math.max(maxY, position.y)
    })
    nextComponentY = maxY + IMPORT_LAYOUT_Y + IMPORT_LAYOUT_COMPONENT_GAP
  })

  return nodes.map((node, index) => ({
    ...node,
    position: positions.get(node.id) ?? {
      x: IMPORT_LAYOUT_START_X,
      y: IMPORT_LAYOUT_START_Y + index * IMPORT_LAYOUT_Y,
    },
  }))
}

function connectedNodeComponents(
  nodes: SchemaNodeDraft[],
  adjacent: Map<string, string[]>,
) {
  const visited = new Set<string>()
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const components: SchemaNodeDraft[][] = []

  nodes.forEach((node) => {
    if (visited.has(node.id)) return

    const component: SchemaNodeDraft[] = []
    const queue = [node.id]
    visited.add(node.id)
    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (!nodeId) continue
      const currentNode = nodesById.get(nodeId)
      if (currentNode) component.push(currentNode)
      ;(adjacent.get(nodeId) ?? []).forEach((nextId) => {
        if (!visited.has(nextId)) {
          visited.add(nextId)
          queue.push(nextId)
        }
      })
    }
    components.push(component)
  })

  return components
}

function layoutImportedComponent(
  component: SchemaNodeDraft[],
  graph: {
    outgoing: Map<string, string[]>
    incoming: Map<string, string[]>
    adjacent: Map<string, string[]>
  },
  startY: number,
) {
  const hub = component.reduce((bestNode, node) => {
    const bestDegree = (graph.adjacent.get(bestNode.id) ?? []).length
    const degree = (graph.adjacent.get(node.id) ?? []).length
    return degree > bestDegree ? node : bestNode
  }, component[0])

  if ((graph.adjacent.get(hub.id) ?? []).length >= IMPORT_LAYOUT_HUB_DEGREE) {
    return layoutHubComponent(component, graph, hub, startY)
  }

  return layoutLayeredComponent(component, graph.incoming, startY)
}

function layoutHubComponent(
  component: SchemaNodeDraft[],
  graph: {
    outgoing: Map<string, string[]>
    incoming: Map<string, string[]>
    adjacent: Map<string, string[]>
  },
  hub: SchemaNodeDraft,
  startY: number,
) {
  const positions = new Map<string, { x: number; y: number }>()
  const componentIds = new Set(component.map((node) => node.id))
  const directNeighbors = uniqueIds([
    ...(graph.outgoing.get(hub.id) ?? []),
    ...(graph.incoming.get(hub.id) ?? []),
    ...(graph.adjacent.get(hub.id) ?? []),
  ]).filter((nodeId) => componentIds.has(nodeId))
  const directRows = Math.max(1, Math.ceil(Math.sqrt(directNeighbors.length)))
  const hubRow = Math.max(1, Math.floor((directRows - 1) / 2))
  positions.set(hub.id, {
    x: IMPORT_LAYOUT_START_X,
    y: startY + hubRow * IMPORT_LAYOUT_Y,
  })

  directNeighbors.forEach((nodeId, index) => {
    const column = 1 + Math.floor(index / directRows)
    const row = index % directRows
    positions.set(nodeId, {
      x: IMPORT_LAYOUT_START_X + column * IMPORT_LAYOUT_X,
      y: startY + row * IMPORT_LAYOUT_Y,
    })
  })

  const rowsByColumn = new Map<number, number>()
  directNeighbors.forEach((_, index) => {
    const column = 1 + Math.floor(index / directRows)
    const row = index % directRows
    rowsByColumn.set(column, Math.max(rowsByColumn.get(column) ?? 0, row + 1))
  })
  const queue = directNeighbors.map((nodeId, index) => ({ nodeId, column: 1 + Math.floor(index / directRows) }))
  while (queue.length > 0) {
    const item = queue.shift()
    if (!item) continue

    const nextIds = uniqueIds([
      ...(graph.outgoing.get(item.nodeId) ?? []),
      ...(graph.incoming.get(item.nodeId) ?? []),
    ]).filter((nodeId) => componentIds.has(nodeId) && nodeId !== hub.id && !positions.has(nodeId))
    nextIds.forEach((nodeId) => {
      const column = item.column + 1
      const row = rowsByColumn.get(column) ?? 0
      rowsByColumn.set(column, row + 1)
      positions.set(nodeId, {
        x: IMPORT_LAYOUT_START_X + column * IMPORT_LAYOUT_X,
        y: startY + row * IMPORT_LAYOUT_Y,
      })
      queue.push({ nodeId, column })
    })
  }

  component.forEach((node) => {
    if (positions.has(node.id)) return
    const row = rowsByColumn.get(0) ?? hubRow + 1
    rowsByColumn.set(0, row + 1)
    positions.set(node.id, {
      x: IMPORT_LAYOUT_START_X,
      y: startY + row * IMPORT_LAYOUT_Y,
    })
  })

  return positions
}

function layoutLayeredComponent(
  component: SchemaNodeDraft[],
  incoming: Map<string, string[]>,
  startY: number,
) {
  const componentIds = new Set(component.map((node) => node.id))
  const layerCache = new Map<string, number>()
  const layerForNode = (nodeId: string, visiting = new Set<string>()): number => {
    const cached = layerCache.get(nodeId)
    if (cached !== undefined) return cached
    if (visiting.has(nodeId)) return 0

    const nextVisiting = new Set(visiting)
    nextVisiting.add(nodeId)
    const sources = (incoming.get(nodeId) ?? []).filter((sourceId) => componentIds.has(sourceId))
    const layer = sources.length === 0
      ? 0
      : Math.max(...sources.map((sourceId) => layerForNode(sourceId, nextVisiting) + 1))
    layerCache.set(nodeId, layer)
    return layer
  }

  const rowsByLayer = new Map<number, number>()
  const positions = new Map<string, { x: number; y: number }>()
  component.forEach((node) => {
    const layer = layerForNode(node.id)
    const row = rowsByLayer.get(layer) ?? 0
    rowsByLayer.set(layer, row + 1)
    positions.set(node.id, {
      x: IMPORT_LAYOUT_START_X + layer * IMPORT_LAYOUT_X,
      y: startY + row * IMPORT_LAYOUT_Y,
    })
  })

  return positions
}

function uniqueIds(values: string[]) {
  const ids: string[] = []
  values.forEach((value) => {
    if (!ids.includes(value)) {
      ids.push(value)
    }
  })
  return ids
}

export function serializeSchemaDraft(draft: SchemaBuilderDraft): string {
  const document = {
    name: draft.name,
    version: draft.version,
    ...(draft.description.trim() ? { description: draft.description } : {}),
    nodes: draft.nodes.map((node) => ({
      label: node.label,
      ...(node.description.trim() ? { description: node.description } : {}),
      key: node.key.length === 1 ? node.key[0] : node.key,
      properties: node.properties.map(propertyToJson),
    })),
    relationships: draft.relationships.map((relationship) => {
      const fromNode = draft.nodes.find((node) => node.id === relationship.fromNodeId)
      const toNode = draft.nodes.find((node) => node.id === relationship.toNodeId)
      return {
        type: relationship.type,
        from: fromNode?.label ?? '',
        to: toNode?.label ?? '',
        ...(relationship.description.trim() ? { description: relationship.description } : {}),
        ...(relationship.properties.length > 0 ? { properties: relationship.properties.map(propertyToJson) } : {}),
      }
    }),
    ...draft.advancedFields,
  }

  return JSON.stringify(document, null, 2)
}

export function validateSchemaBuilderDraft(
  draft: SchemaBuilderDraft,
  parseError?: string | null,
): SchemaBuilderValidationIssue[] {
  const issues: SchemaBuilderValidationIssue[] = []
  if (parseError) {
    issues.push({ path: 'content', message: parseError })
    return issues
  }

  if (!draft.name.trim()) {
    issues.push({ path: 'name', message: 'Schema name is required.' })
  }
  if (!Number.isFinite(draft.version) || draft.version <= 0) {
    issues.push({ path: 'version', message: 'Schema version must be greater than 0.' })
  }
  if (draft.nodes.length === 0) {
    issues.push({ path: 'nodes', message: 'Add at least one node.' })
  }

  const labels = new Set<string>()
  draft.nodes.forEach((node, index) => {
    const path = `nodes[${index}]`
    const label = node.label.trim()
    if (!label) {
      issues.push({ path: `${path}.label`, message: 'Node label is required.' })
    } else if (labels.has(label)) {
      issues.push({ path: `${path}.label`, message: `Duplicate node label "${label}".` })
    }
    labels.add(label)

    const propertyNames = new Set(node.properties.map((property) => property.name.trim()).filter(Boolean))
    if (node.key.length === 0 || node.key.every((key) => !key.trim())) {
      issues.push({ path: `${path}.key`, message: 'Node key is required.' })
    }
    node.key.forEach((key) => {
      if (key.trim() && !propertyNames.has(key.trim())) {
        issues.push({ path: `${path}.key`, message: `Key property "${key}" must be declared on the node.` })
      }
    })
    node.properties.forEach((property, propertyIndex) => {
      if (!property.name.trim()) {
        issues.push({ path: `${path}.properties[${propertyIndex}].name`, message: 'Property name is required.' })
      }
      if (!property.type.trim()) {
        issues.push({ path: `${path}.properties[${propertyIndex}].type`, message: 'Property type is required.' })
      }
    })
  })

  const relationshipTypes = new Set<string>()
  draft.relationships.forEach((relationship, index) => {
    const path = `relationships[${index}]`
    const type = relationship.type.trim()
    if (!type) {
      issues.push({ path: `${path}.type`, message: 'Relationship type is required.' })
    } else if (relationshipTypes.has(type)) {
      issues.push({ path: `${path}.type`, message: `Duplicate relationship type "${type}".` })
    }
    relationshipTypes.add(type)
    if (!draft.nodes.some((node) => node.id === relationship.fromNodeId)) {
      issues.push({ path: `${path}.from`, message: 'Relationship source node is required.' })
    }
    if (!draft.nodes.some((node) => node.id === relationship.toNodeId)) {
      issues.push({ path: `${path}.to`, message: 'Relationship target node is required.' })
    }
    relationship.properties.forEach((property, propertyIndex) => {
      if (!property.name.trim()) {
        issues.push({ path: `${path}.properties[${propertyIndex}].name`, message: 'Property name is required.' })
      }
      if (!property.type.trim()) {
        issues.push({ path: `${path}.properties[${propertyIndex}].type`, message: 'Property type is required.' })
      }
    })
  })

  return issues
}

export function makeNodeDraft(index: number, overrides: Partial<SchemaNodeDraft> = {}): SchemaNodeDraft {
  const id = overrides.id ?? `node-${index + 1}`
  return {
    id,
    label: overrides.label ?? `Node${index + 1}`,
    description: overrides.description ?? '',
    key: overrides.key ?? [],
    properties: overrides.properties ?? [],
    position: overrides.position ?? { x: 80 + (index % 3) * 260, y: 80 + Math.floor(index / 3) * 180 },
  }
}

export function makePropertyDraft(index: number, overrides: Partial<SchemaPropertyDraft> = {}): SchemaPropertyDraft {
  return {
    id: overrides.id ?? `property-${index + 1}`,
    name: overrides.name ?? '',
    type: overrides.type ?? 'string',
    required: overrides.required ?? false,
  }
}

export function makeRelationshipDraft(
  index: number,
  overrides: Partial<SchemaRelationshipDraft> = {},
): SchemaRelationshipDraft {
  return {
    id: overrides.id ?? `relationship-${index + 1}`,
    type: overrides.type ?? `RELATIONSHIP_${index + 1}`,
    fromNodeId: overrides.fromNodeId ?? '',
    toNodeId: overrides.toNodeId ?? '',
    description: overrides.description ?? '',
    properties: overrides.properties ?? [],
  }
}

function toNodeDraft(node: unknown, index: number): SchemaNodeDraft {
  const record = isRecord(node) ? node : {}
  const label = typeof record.label === 'string' ? record.label : ''
  const properties = Array.isArray(record.properties) ? record.properties : []

  return makeNodeDraft(index, {
    id: uniqueId('node', label || String(index + 1), index),
    label,
    description: typeof record.description === 'string' ? record.description : '',
    key: normalizeKey(record.key),
    properties: properties.map((property, propertyIndex) => toPropertyDraft(property, propertyIndex, label)),
  })
}

function toRelationshipDraft(
  relationship: unknown,
  index: number,
  nodeIdsByLabel: Map<string, string>,
): SchemaRelationshipDraft {
  const record = isRecord(relationship) ? relationship : {}
  const type = typeof record.type === 'string' ? record.type : ''
  const from = typeof record.from === 'string' ? record.from : ''
  const to = typeof record.to === 'string' ? record.to : ''
  const properties = Array.isArray(record.properties) ? record.properties : []

  const idSource = [type, from, to].filter(Boolean).join('-') || String(index + 1)

  return makeRelationshipDraft(index, {
    id: uniqueId('relationship', idSource, index),
    type,
    fromNodeId: nodeIdsByLabel.get(from) ?? '',
    toNodeId: nodeIdsByLabel.get(to) ?? '',
    description: typeof record.description === 'string' ? record.description : '',
    properties: properties.map((property, propertyIndex) => toPropertyDraft(property, propertyIndex, type)),
  })
}

function toPropertyDraft(property: unknown, index: number, owner: string): SchemaPropertyDraft {
  const record = isRecord(property) ? property : {}
  const name = typeof record.name === 'string' ? record.name : ''
  return makePropertyDraft(index, {
    id: uniqueId('property', `${owner}-${name || index + 1}`, index),
    name,
    type: typeof record.type === 'string' ? record.type : 'string',
    required: record.required === true,
  })
}

function propertyToJson(property: SchemaPropertyDraft) {
  return {
    name: property.name,
    type: property.type,
    ...(property.required ? { required: true } : {}),
  }
}

function normalizeKey(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string' && value.trim()) {
    return [value]
  }
  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function uniqueId(prefix: string, value: string, index: number) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${prefix}-${slug || index + 1}-${index + 1}`
}
