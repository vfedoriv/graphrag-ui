import type {
  DocumentChunk,
  DocumentUpload,
  GeneratedQueryResponse,
  KnowledgeBase,
  QueryAskResponse,
  QueryExecutionResponse,
  QueryValidation,
  Schema,
} from '../../src/api/types'

export const knowledgeBasesFixture: KnowledgeBase[] = [
  {
    id: 'kb-alpha',
    name: 'Alpha Research',
    activeSchemaId: 'schema-customer',
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'kb-beta',
    name: 'Beta Archive',
    activeSchemaId: null,
    createdAt: '2026-05-02T10:00:00.000Z',
  },
]

export const schemasFixture: Schema[] = [
  {
    id: 'schema-customer',
    name: 'Customer graph',
    version: 1,
    sourceType: 'PREDEFINED',
    format: 'JSON',
    contentHash: 'hash-customer',
    status: 'ACTIVE',
    createdAt: '2026-05-03T10:00:00.000Z',
  },
]

export const schemaContent = JSON.stringify({
  nodes: [{ label: 'Customer', properties: ['name'] }],
  relationships: [],
})

export const documentsFixture: DocumentUpload[] = [
  {
    id: 'doc-alpha',
    knowledgeBaseId: 'kb-alpha',
    originalFilename: 'alpha-notes.txt',
    contentType: 'text/plain',
    sizeBytes: 48,
    sha256: 'sha-alpha',
    contentUri: 'memory://alpha-notes.txt',
    status: 'UPLOADED',
    uploadedAt: '2026-05-04T10:00:00.000Z',
    processedAt: null,
    errorMessage: null,
  },
]

export const chunksFixture: DocumentChunk[] = [
  {
    id: 'chunk-alpha-0',
    documentId: 'doc-alpha',
    chunkIndex: 0,
    text: 'Alpha customer chunk text',
    tokenEstimate: 5,
    metadata: '{"page":1}',
  },
]

export const queryValidationFixture: QueryValidation = {
  valid: true,
  cypher: 'MATCH (n) RETURN n.name AS name LIMIT 5',
  parameters: {},
  errors: [],
  maxRows: 5,
  timeoutSeconds: 10,
}

export const generatedQueryFixture: GeneratedQueryResponse = {
  cypher: queryValidationFixture.cypher,
  explanation: 'Finds customer names.',
  parameters: {},
  validation: queryValidationFixture,
}

export const executionFixture: QueryExecutionResponse = {
  cypher: queryValidationFixture.cypher,
  parameters: {},
  validation: queryValidationFixture,
  columns: ['name'],
  rows: [{ name: 'Ada Lovelace' }],
  rowCount: 1,
  executionTimeMs: 12,
}

export const askFixture: QueryAskResponse = {
  generatedQuery: generatedQueryFixture,
  execution: executionFixture,
}
