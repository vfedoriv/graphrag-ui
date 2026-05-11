import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  CreateSchemaRequest,
  GenerateSchemaExampleRequest,
  GenerateSchemaExampleResponse,
  GenerateSchemaRequest,
  GenerateSchemaResponse,
  Schema,
  SchemaValidationResponse,
  ValidateSchemaRequest,
} from './types'

export const schemasApi = {
  list: () => apiFetch<Schema[]>('/schemas'),
  get: (id: string) => apiFetch<Schema>(`/schemas/${id}`),
  validate: (payload: ValidateSchemaRequest) =>
    apiFetch<SchemaValidationResponse>('/schemas/validate', { method: 'POST', body: toJsonBody(payload) }),
  create: (payload: CreateSchemaRequest) =>
    apiFetch<Schema>('/schemas', { method: 'POST', body: toJsonBody(payload) }),
  generateExample: (payload: GenerateSchemaExampleRequest) =>
    apiFetch<GenerateSchemaExampleResponse>('/schemas/generate/example', {
      method: 'POST',
      body: toJsonBody(payload),
    }),
  generateYaml: (payload: GenerateSchemaRequest) =>
    apiFetch<GenerateSchemaResponse>('/schemas/generate', { method: 'POST', body: toJsonBody(payload) }),
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
