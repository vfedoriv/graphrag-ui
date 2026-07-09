import type { DocumentUpload } from '../../api/types'

export function getDocumentOpenTarget(doc: DocumentUpload) {
  if (doc.localPath) return doc.localPath
  if (isUsableDocumentUri(doc.contentUri)) return doc.contentUri
  return null
}

export async function requestLocalFileOpen(localPath: string) {
  const response = await fetch('/__graphrag-ui/open-local-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: localPath }),
  })

  if (!response.ok) {
    throw new Error(await getOpenFailureMessage(response))
  }
}

async function getOpenFailureMessage(response: Response) {
  try {
    const payload = (await response.json()) as unknown
    if (isRecord(payload) && typeof payload.detail === 'string') {
      return payload.detail
    }
  } catch {
    // Fall through to status-based feedback.
  }
  if (response.status === 404) {
    return 'Local file opening is not available from this server. Copy the source path and open it locally.'
  }
  return 'Unable to open local file. Copy the source path and open it locally.'
}

function isUsableDocumentUri(value: string | null | undefined) {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return ['file:', 'http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
