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
  UpdateSchemaRequest,
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
  listForKnowledgeBase: (knowledgeBaseId: string) => apiFetch<Schema[]>(`/knowledge-bases/${knowledgeBaseId}/schemas`),
  get: (id: string) => apiFetch<SchemaDetails>(`/schemas/${id}`),
  validate: (payload: ValidateSchemaRequest) =>
    apiFetch<SchemaValidationResponse>('/schemas/validate', { method: 'POST', body: toJsonBody(payload) }),
  create: (payload: CreateSchemaRequest) =>
    apiFetch<Schema>('/schemas', { method: 'POST', body: toJsonBody(payload) }),
  update: (schemaId: string, payload: UpdateSchemaRequest) =>
    apiFetch<SchemaDetails>(`/schemas/${schemaId}`, { method: 'PUT', body: toJsonBody(payload) }),
  delete: (schemaId: string) => apiFetch<void>(`/schemas/${schemaId}`, { method: 'DELETE' }),
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

export function useSchemasByKnowledgeBaseQuery(knowledgeBaseId: string | null) {
  return useQuery({
    queryKey: queryKeys.schemasByKnowledgeBaseMaybe(knowledgeBaseId),
    queryFn: () => {
      if (!knowledgeBaseId) {
        throw new Error('Cannot load schemas without a knowledge base id')
      }
      return schemasApi.listForKnowledgeBase(knowledgeBaseId)
    },
    enabled: Boolean(knowledgeBaseId),
  })
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
    mutationFn: ({ payload }: { payload: CreateSchemaRequest; knowledgeBaseId?: string | null }) => schemasApi.create(payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas() })
      if (vars.knowledgeBaseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.schemasByKnowledgeBase(vars.knowledgeBaseId) })
      }
    },
  })
}

export function useUpdateSchemaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ schemaId, payload }: { schemaId: string; payload: UpdateSchemaRequest; knowledgeBaseId?: string | null }) =>
      schemasApi.update(schemaId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas() })
      queryClient.invalidateQueries({ queryKey: queryKeys.schema(vars.schemaId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.schemaLookup(vars.schemaId) })
      if (vars.knowledgeBaseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.schemasByKnowledgeBase(vars.knowledgeBaseId) })
      }
    },
  })
}

export function useDeleteSchemaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ schemaId }: { schemaId: string; knowledgeBaseId?: string | null }) => schemasApi.delete(schemaId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schemas() })
      queryClient.invalidateQueries({ queryKey: queryKeys.schema(vars.schemaId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.schemaLookup(vars.schemaId) })
      if (vars.knowledgeBaseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.schemasByKnowledgeBase(vars.knowledgeBaseId) })
      }
    },
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
      queryClient.invalidateQueries({ queryKey: queryKeys.schemasByKnowledgeBase(vars.knowledgeBaseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeBases() })
    },
  })
}
