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

const branchingSchemaContent = JSON.stringify({
  name: 'literary-graph',
  version: 1,
  nodes: [
    { label: 'Person', key: ['fullName', 'publicationVenue', 'nationality'], properties: [{ name: 'fullName', type: 'string', required: true }] },
    { label: 'Work', key: ['title', 'author'], properties: [{ name: 'title', type: 'string', required: true }] },
    { label: 'Genre', key: 'name', properties: [{ name: 'name', type: 'string', required: true }] },
    { label: 'Publication', key: 'name', properties: [{ name: 'name', type: 'string', required: true }] },
  ],
  relationships: [
    { type: 'NOTABLE_WORK', from: 'Person', to: 'Work' },
    { type: 'LITERARY_GENRE', from: 'Work', to: 'Genre' },
    { type: 'PUBLISHED_IN', from: 'Work', to: 'Publication' },
  ],
})

const hubSchemaContent = JSON.stringify({
  name: 'person-hub',
  version: 1,
  nodes: [
    { label: 'Person', key: ['fullName', 'birthDate', 'nationality'], properties: [{ name: 'fullName', type: 'string', required: true }] },
    { label: 'Book', key: ['title', 'author'], properties: [{ name: 'title', type: 'string', required: true }] },
    { label: 'Award', key: 'name', properties: [{ name: 'name', type: 'string', required: true }] },
    { label: 'Film', key: ['title', 'releaseYear'], properties: [{ name: 'title', type: 'string', required: true }] },
    { label: 'Invention', key: 'name', properties: [{ name: 'name', type: 'string', required: true }] },
    { label: 'Location', key: 'country', properties: [{ name: 'country', type: 'string', required: true }] },
  ],
  relationships: [
    { type: 'NOTABLE_WORK', from: 'Person', to: 'Book' },
    { type: 'RECEIVED_AWARD', from: 'Person', to: 'Award' },
    { type: 'PROPOSED', from: 'Person', to: 'Film' },
    { type: 'NATIONALITY', from: 'Person', to: 'Invention' },
    { type: 'HOST_OF', from: 'Person', to: 'Location' },
  ],
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

  it('lays out imported relationship chains with wider layered spacing', () => {
    const result = parseSchemaContentToDraft(branchingSchemaContent)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const byLabel = new Map(result.draft.nodes.map((node) => [node.label, node]))
    const person = byLabel.get('Person')
    const work = byLabel.get('Work')
    const genre = byLabel.get('Genre')
    const publication = byLabel.get('Publication')

    expect(person).toBeDefined()
    expect(work).toBeDefined()
    expect(genre).toBeDefined()
    expect(publication).toBeDefined()
    if (!person || !work || !genre || !publication) return

    expect(work.position.x - person.position.x).toBeGreaterThanOrEqual(360)
    expect(genre.position.x - work.position.x).toBeGreaterThanOrEqual(360)
    expect(publication.position.x).toBe(genre.position.x)
    expect(Math.abs(publication.position.y - genre.position.y)).toBeGreaterThanOrEqual(220)
  })

  it('fans out high-degree imported hub nodes instead of stacking neighbors in one lane', () => {
    const result = parseSchemaContentToDraft(hubSchemaContent)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const byLabel = new Map(result.draft.nodes.map((node) => [node.label, node]))
    const person = byLabel.get('Person')
    const neighbors = ['Book', 'Award', 'Film', 'Invention', 'Location'].map((label) => byLabel.get(label))

    expect(person).toBeDefined()
    expect(neighbors.every(Boolean)).toBe(true)
    if (!person || neighbors.some((node) => !node)) return

    const neighborNodes = neighbors.filter((node): node is NonNullable<typeof node> => Boolean(node))
    expect(new Set(neighborNodes.map((node) => node.position.x)).size).toBeGreaterThan(1)
    expect(neighborNodes.every((node) => node.position.x > person.position.x)).toBe(true)
    expect(Math.max(...neighborNodes.map((node) => node.position.y)) - Math.min(...neighborNodes.map((node) => node.position.y))).toBeLessThan(900)
    expect(person.position.y).toBeGreaterThanOrEqual(Math.min(...neighborNodes.map((node) => node.position.y)))
    expect(person.position.y).toBeLessThanOrEqual(Math.max(...neighborNodes.map((node) => node.position.y)))
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
