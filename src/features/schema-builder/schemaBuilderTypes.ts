export type SchemaPropertyDraft = {
  id: string
  name: string
  type: string
  required: boolean
}

export type SchemaNodeDraft = {
  id: string
  label: string
  description: string
  key: string[]
  properties: SchemaPropertyDraft[]
  position: {
    x: number
    y: number
  }
}

export type SchemaRelationshipDraft = {
  id: string
  type: string
  fromNodeId: string
  toNodeId: string
  description: string
  properties: SchemaPropertyDraft[]
}

export type SchemaBuilderDraft = {
  name: string
  version: number
  description: string
  nodes: SchemaNodeDraft[]
  relationships: SchemaRelationshipDraft[]
  advancedFields: Record<string, unknown>
  sourceSchemaId?: string
  sourceType?: string
}

export type SchemaBuilderValidationIssue = {
  path: string
  message: string
}
