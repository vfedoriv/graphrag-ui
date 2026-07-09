export function parseChunkMetadata(metadata: string) {
  try {
    const parsed = JSON.parse(metadata) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function getPageAwareChunkMetadata(metadata: Record<string, unknown>) {
  return [
    { label: 'Page', value: firstPresent(metadata, ['sourcePage', 'pageNumber', 'page_number', 'page']) },
    { label: 'Page count', value: firstPresent(metadata, ['pageCount', 'page_count', 'totalPages', 'total_pages']) },
    { label: 'Parser', value: firstPresent(metadata, ['parserId', 'parser_id', 'parser']) },
    { label: 'File format', value: firstPresent(metadata, ['fileFormat', 'file_format', 'format']) },
    { label: 'Section', value: firstPresent(metadata, ['sectionIndex', 'section_index', 'section']) },
    { label: 'Processing run', value: firstPresent(metadata, ['processingRunId', 'processing_run_id', 'runId', 'run_id']) },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))
}

function firstPresent(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
