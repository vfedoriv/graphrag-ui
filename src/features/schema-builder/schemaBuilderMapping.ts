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
  const advancedFields = Object.fromEntries(
    Object.entries(document).filter(([key]) => !KNOWN_TOP_LEVEL_FIELDS.has(key)),
  )

  return {
    name: typeof document.name === 'string' ? document.name : '',
    version: typeof document.version === 'number' ? document.version : Number(document.version) || 1,
    description: typeof document.description === 'string' ? document.description : '',
    nodes: draftNodes,
    relationships: relationships.map((relationship, index) => toRelationshipDraft(relationship, index, nodeIdsByLabel)),
    advancedFields,
    sourceSchemaId: source?.schemaId,
    sourceType: source?.sourceType,
  }
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
