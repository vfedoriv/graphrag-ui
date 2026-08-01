import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import { queryKeys } from './queryKeys'
import type { ChunkingState } from './types'

export const chunkingApi = {
  state: () => apiFetch<ChunkingState>('/chunking-state'),
}

export function useChunkingStateQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.chunkingState(),
    queryFn: chunkingApi.state,
    enabled,
  })
}
