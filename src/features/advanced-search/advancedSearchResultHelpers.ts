import type { AdvancedSearchEvidence, AdvancedSearchGraphFact, AdvancedSearchResultV1, DocumentUpload } from '../../api/types'

export type AdvancedSearchResultMaps = {
  evidenceByCitationId: Map<string, AdvancedSearchEvidence>
  graphFactById: Map<string, AdvancedSearchGraphFact>
}

export function buildAdvancedSearchResultMaps(result: AdvancedSearchResultV1): AdvancedSearchResultMaps {
  return {
    evidenceByCitationId: new Map(result.evidence.concat(result.contexts).map((entry) => [entry.citationId, entry])),
    graphFactById: new Map(result.graphFacts.map((fact) => [fact.factId, fact])),
  }
}

export function resolveAdvancedSearchSourceLabel(entry: AdvancedSearchEvidence, documents: DocumentUpload[]) {
  if (entry.sourceDisplayLabel) return entry.sourceDisplayLabel
  if (entry.sourceFilename) return entry.sourceFilename
  if (entry.documentId) {
    const cachedDocument = documents.find((document) => document.id === entry.documentId)
    if (cachedDocument?.originalFilename) return cachedDocument.originalFilename
    return entry.documentId
  }
  return 'Source label unavailable'
}

export function chunkExplorerHref(entry: AdvancedSearchEvidence) {
  if (!entry.documentId || !entry.chunkId) return null
  const params = new URLSearchParams({
    view: 'chunks',
    documentId: entry.documentId,
    chunkId: entry.chunkId,
  })
  return `/chunking?${params.toString()}`
}
