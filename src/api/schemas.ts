import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, toJsonBody } from './client'
import { queryKeys } from './queryKeys'
import type {
  CreateSchemaRequest,
  GenerateSchemaExampleRawResponse,
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
import { ApiError } from './types'

function normalizeSchemaExampleResponse(raw: GenerateSchemaExampleRawResponse): GenerateSchemaExampleResponse {
  if (typeof raw === 'string') {
    return { example: raw }
  }
  if (raw && typeof raw === 'object' && typeof raw.example === 'string') {
    return { example: raw.example }
  }
  throw new ApiError({
    status: 200,
    message: 'Schema example response has unexpected shape',
  })
}

export const schemasApi = {
  list: () => apiFetch<Schema[]>('/schemas'),
  get: (id: string) => apiFetch<SchemaDetails>(`/schemas/${id}`),
  validate: (payload: ValidateSchemaRequest) =>
    apiFetch<SchemaValidationResponse>('/schemas/validate', { method: 'POST', body: toJsonBody(payload) }),
  create: (payload: CreateSchemaRequest) =>
    apiFetch<Schema>('/schemas', { method: 'POST', body: toJsonBody(payload) }),
  generateExample: async (payload: GenerateSchemaExampleRequest) => {
    const raw = await apiFetch<GenerateSchemaExampleRawResponse>('/schemas/generate/example', {
      method: 'POST',
      body: toJsonBody(payload),
    })
    return normalizeSchemaExampleResponse(raw)
  },
  generateExampleFromFile: (payload: GenerateSchemaExampleFromFileRequest) => {
    const formData = new FormData()
    if (payload.userPrompt?.trim()) {
      formData.set('userPrompt', payload.userPrompt)
    }
    formData.set('file', payload.file)
    return apiFetch<GenerateSchemaExampleRawResponse>('/schemas/generate/example/from-file', {
      method: 'POST',
      body: formData,
    }).then(normalizeSchemaExampleResponse)
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

export function useSchemaQuery(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.schemaLookup(id) : (['schemas', 'lookup', 'none'] as const),
    queryFn: () => {
      if (!id) {
        throw new Error('Cannot load schema without a schema id')
      }
      return schemasApi.get(id)
    },
    enabled: Boolean(id),
  })
}

export function useGetSchemaMutation() {
  return useMutation({ mutationFn: schemasApi.get })
}

export function useValidateSchemaMutation() {
  return useMutation({ mutationFn: schemasApi.validate })
}

export function useCreateSchemaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: schemasApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.schemas() }),
  })
}

export function useGenerateSchemaExampleMutation() {
  return useMutation({ mutationFn: schemasApi.generateExample })
}

export function useGenerateSchemaExampleFromFileMutation() {
  return useMutation({ mutationFn: schemasApi.generateExampleFromFile })
}

export function useGenerateSchemaJsonMutation() {
  return useMutation({ mutationFn: schemasApi.generateJson })
}

export function useGenerateSchemaJsonFromFileMutation() {
  return useMutation({ mutationFn: schemasApi.generateJsonFromFile })
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
