import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  CreateSchemaRequest,
  GenerateSchemaExampleFromFileRequest,
  GenerateSchemaExampleRequest,
  GenerateSchemaExampleResponse,
  GenerateSchemaFromFileRequest,
  GenerateSchemaRequest,
  GenerateSchemaResponse,
  Schema,
  SchemaDetails,
  SchemaValidationResponse,
  ValidateSchemaRequest,
} from './types'

export const schemasApi = {
  list: () => apiFetch<Schema[]>('/schemas'),
  get: (id: string) => apiFetch<SchemaDetails>(`/schemas/${id}`),
  validate: (payload: ValidateSchemaRequest) =>
    apiFetch<SchemaValidationResponse>('/schemas/validate', { method: 'POST', body: toJsonBody(payload) }),
  create: (payload: CreateSchemaRequest) =>
    apiFetch<Schema>('/schemas', { method: 'POST', body: toJsonBody(payload) }),
  generateExample: (payload: GenerateSchemaExampleRequest) =>
    apiFetch<GenerateSchemaExampleResponse>('/schemas/generate/example', {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  generateExampleFromFile: (payload: GenerateSchemaExampleFromFileRequest) => {
    const formData = new FormData()
    if (payload.userPrompt?.trim()) {
      formData.set('userPrompt', payload.userPrompt)
    }
    formData.set('file', payload.file)
    return apiFetch<GenerateSchemaExampleResponse>('/schemas/generate/example/from-file', {
      method: 'POST',
      body: formData,
    })
  },
  generateJson: (payload: GenerateSchemaRequest) =>
    apiFetch<GenerateSchemaResponse>('/schemas/generate', { method: 'POST', body: toJsonBody(payload) }),
  generateJsonFromFile: (payload: GenerateSchemaFromFileRequest) => {
    const formData = new FormData()
    const request = {
      name: payload.name,
      version: payload.version,
      description: payload.description,
      example: payload.example,
    }
    formData.set('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
    formData.set('file', payload.file)
    return apiFetch<GenerateSchemaResponse>('/schemas/generate/from-file', { method: 'POST', body: formData })
  },
  activate: (knowledgeBaseId: string, schemaId: string) =>
    apiFetch<void>(`/knowledge-bases/${knowledgeBaseId}/schemas/${schemaId}/activate`, { method: 'POST' }),
}

export function useSchemasQuery() {
  return useQuery({ queryKey: queryKeys.schemas(), queryFn: schemasApi.list })
}

export function useCreateSchemaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: schemasApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schemas() }),
  })
}

export function useActivateSchemaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ knowledgeBaseId, schemaId }: { knowledgeBaseId: string; schemaId: string }) =>
      schemasApi.activate(knowledgeBaseId, schemaId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBase(vars.knowledgeBaseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
    },
  })
}
