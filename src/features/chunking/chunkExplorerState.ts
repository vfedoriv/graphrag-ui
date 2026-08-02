export const CHUNK_EXPLORER_PAGE_SIZE = 20

export function normalizeChunkExplorerId(value: string | null) {
  const normalized = value?.trim() ?? ''
  return normalized || null
}

export function readChunkExplorerSelection(search: string) {
  const params = new URLSearchParams(search)
  return {
    documentId: normalizeChunkExplorerId(params.get('documentId')),
    chunkId: normalizeChunkExplorerId(params.get('chunkId')),
  }
}
