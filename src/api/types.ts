export type ProblemDetailErrors = Record<string, string[] | string> | string[]

export type ProblemDetail = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: ProblemDetailErrors
  [key: string]: unknown
}

export class ApiError extends Error {
  status: number
  title?: string
  fieldErrors?: Record<string, string[]>
  details?: string[]

  constructor(params: {
    status: number
    message: string
    title?: string
    fieldErrors?: Record<string, string[]>
    details?: string[]
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.title = params.title
    this.fieldErrors = params.fieldErrors
    this.details = params.details
  }
}

export type KnowledgeBase = {
  id: string
  name: string
  activeSchemaId: string | null
  createdAt: string
}

export type CreateKnowledgeBaseRequest = {
  id: string
  name: string
}

export type UpdateKnowledgeBaseRequest = {
  name: string
}

export type Schema = {
  id: string
  name: string
  version: number
  sourceType: string
  format: SchemaFormat
  contentHash: string
  status: string
  createdAt: string
}

export type SchemaSourceType = 'PREDEFINED' | 'GENERATED'
export type SchemaFormat = 'JSON'

export type SchemaDetails = Schema & {
  content: string
}

export type CreateSchemaRequest = {
  content: string
  sourceType?: SchemaSourceType
}

export type UpdateSchemaRequest = {
  content: string
  sourceType?: SchemaSourceType
}

export type ValidateSchemaRequest = {
  content: string
}

export type SchemaValidationResponse = {
  valid: boolean
  errors: string[]
}

export type GenerateSchemaExampleRequest = {
  text: string
  userPrompt?: string
}

export type GenerateSchemaExampleResponse = {
  example: string
}

export type GenerateSchemaExampleRawResponse = string | GenerateSchemaExampleResponse

export type GenerateSchemaRequest = {
  name: string
  version: number
  description?: string
  text: string
  example: string
}

export type GenerateSchemaFromFileRequest = {
  name: string
  version: number
  description?: string
  example: string
  file: File
}

export type GenerateSchemaExampleFromFileRequest = {
  userPrompt?: string
  file: File
}

export type GenerateSchemaResponse = {
  content: string
  warnings?: SchemaGenerationWarning[]
}

export type SchemaGenerationWarning = {
  code?: string
  message: string
  suggestion?: string
  [key: string]: unknown
}

export type DocumentUpload = {
  id: string
  knowledgeBaseId: string
  originalFilename: string
  contentType: string
  sizeBytes: number
  sha256: string
  contentUri: string
  localPath?: string | null
  status: string
  uploadedAt: string
  processedAt: string | null
  errorMessage: string | null
}

export type DocumentChunk = {
  id: string
  documentId: string
  chunkIndex: number
  text: string
  tokenEstimate: number
  metadata: string
}

export type QueryGenerateRequest = { prompt: string }

export type QueryValidation = {
  valid: boolean
  cypher: string
  parameters: Record<string, unknown>
  errors: string[]
  maxRows: number
  timeoutSeconds: number
}

export type GeneratedQueryResponse = {
  cypher: string
  explanation: string
  parameters: Record<string, unknown>
  validation: QueryValidation
}

export type QueryValidateRequest = {
  cypher: string
  parameters?: Record<string, unknown>
}

export type QueryExecutionResponse = {
  cypher: string
  parameters: Record<string, unknown>
  validation: QueryValidation
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTimeMs: number
}

export type QueryAskResponse = {
  generatedQuery: GeneratedQueryResponse
  execution: QueryExecutionResponse
}

export type HybridSearchRequest = {
  query: string
  topK?: number
  graphDepth?: number
  includeChunkText?: boolean
}

export type HybridSearchSource = {
  documentId: string
  originalFilename?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  chunkMetadata?: string | Record<string, unknown> | null
  filename?: string | null
  metadata?: Record<string, unknown>
}

export type HybridSearchGraphEntity = {
  elementId?: string
  labels?: string[]
  properties: Record<string, unknown>
  id?: string
}

export type HybridSearchGraphRelationship = {
  elementId?: string
  type: string
  startNodeElementId?: string
  endNodeElementId?: string
  properties: Record<string, unknown>
  id?: string
  startEntityId?: string
  endEntityId?: string
  startElementId?: string
  endElementId?: string
}

export type HybridSearchGraphContext = {
  entities: HybridSearchGraphEntity[]
  relationships: HybridSearchGraphRelationship[]
}

export type HybridSearchHit = {
  chunkId: string
  documentId: string
  chunkIndex: number
  score: number
  text?: string | null
  source: HybridSearchSource
  graph?: HybridSearchGraphContext | null
  graphContext?: HybridSearchGraphContext | null
}

export type HybridSearchResponse = {
  query: string
  topK: number
  graphDepth: number
  includeChunkText: boolean
  hits: HybridSearchHit[]
  hitCount: number
  executionTimeMs: number
}
