import { describe, expect, it } from 'vitest'
import {
  createBlankSchemaDraft,
  parseSchemaContentToDraft,
  serializeSchemaDraft,
  validateSchemaBuilderDraft,
} from './schemaBuilderMapping'

const schemaContent = JSON.stringify({
  name: 'legal-contracts',
  version: 1,
  description: 'Schema for contract analysis',
  nodes: [
    {
      label: 'Contract',
      description: 'A legal contract',
      key: 'contractId',
      properties: [
        { name: 'contractId', type: 'string', required: true },
        { name: 'title', type: 'string' },
      ],
    },
    {
      label: 'Party',
      key: ['name'],
      properties: [{ name: 'name', type: 'string', required: true }],
    },
  ],
  relationships: [
    {
      type: 'HAS_PARTY',
      from: 'Contract',
      to: 'Party',
      properties: [{ name: 'role', type: 'string' }],
    },
  ],
  indexes: [{ label: 'Contract', properties: ['contractId'], unique: true }],
  vectorIndexes: [{ name: 'document_chunk_embedding', label: 'DocumentChunk', property: 'embedding', dimensions: 1536 }],
  customTopLevel: { preserved: true },
})

describe('schemaBuilderMapping', () => {
  it('imports schema JSON into a builder draft', () => {
    const result = parseSchemaContentToDraft(schemaContent, { schemaId: 'schema-1', sourceType: 'PREDEFINED' })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.draft.name).toBe('legal-contracts')
    expect(result.draft.sourceSchemaId).toBe('schema-1')
    expect(result.draft.nodes).toHaveLength(2)
    expect(result.draft.nodes[0].key).toEqual(['contractId'])
    expect(result.draft.relationships[0]).toMatchObject({
      type: 'HAS_PARTY',
      fromNodeId: result.draft.nodes[0].id,
      toNodeId: result.draft.nodes[1].id,
    })
  })

  it('serializes builder drafts and preserves advanced top-level fields', () => {
    const result = parseSchemaContentToDraft(schemaContent)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const serialized = JSON.parse(serializeSchemaDraft(result.draft))

    expect(serialized.nodes[0].key).toBe('contractId')
    expect(serialized.relationships[0]).toMatchObject({ type: 'HAS_PARTY', from: 'Contract', to: 'Party' })
    expect(serialized.indexes).toEqual([{ label: 'Contract', properties: ['contractId'], unique: true }])
    expect(serialized.vectorIndexes[0].name).toBe('document_chunk_embedding')
    expect(serialized.customTopLevel).toEqual({ preserved: true })
  })

  it('returns parse errors without replacing invalid content', () => {
    const result = parseSchemaContentToDraft('{ invalid')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/JSON|property|Expected|Unexpected/i)
  })

  it('validates required metadata, keys, duplicates, and relationship endpoints', () => {
    const draft = createBlankSchemaDraft()
    draft.nodes = [
      {
        id: 'node-1',
        label: 'Contract',
        description: '',
        key: ['missing'],
        properties: [{ id: 'property-1', name: 'contractId', type: 'string', required: true }],
        position: { x: 0, y: 0 },
      },
      {
        id: 'node-2',
        label: 'Contract',
        description: '',
        key: ['contractId'],
        properties: [{ id: 'property-2', name: 'contractId', type: '', required: false }],
        position: { x: 100, y: 100 },
      },
    ]
    draft.relationships = [{ id: 'rel-1', type: '', fromNodeId: 'node-1', toNodeId: 'missing-node', description: '', properties: [] }]

    const issues = validateSchemaBuilderDraft(draft)

    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(['name', 'nodes[0].key', 'nodes[1].label', 'nodes[1].properties[0].type', 'relationships[0].type', 'relationships[0].to']),
    )
  })
})
