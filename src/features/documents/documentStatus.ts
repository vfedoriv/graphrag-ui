const completedStatusTokens = ['PROCESSED', 'COMPLETED', 'SUCCESS']
const idleStatusTokens = ['UPLOADED', 'FAILED', 'ERROR']
const processingStatusTokens = [
  'PROCESSING',
  'IN_PROGRESS',
  'PENDING',
  'RUNNING',
  'QUEUED',
  'EXTRACTING',
  'EMBEDDING',
]

function normalizeDocumentStatus(status: string) {
  return status.trim().toUpperCase()
}

export function isCompletedOrSuccessfullyProcessed(status: string) {
  const normalized = normalizeDocumentStatus(status)
  return completedStatusTokens.some((token) => normalized.includes(token))
}

export function isDocumentProcessingStatus(status: string) {
  const normalized = normalizeDocumentStatus(status)

  if (!normalized || isCompletedOrSuccessfullyProcessed(normalized)) {
    return false
  }
  if (idleStatusTokens.some((token) => normalized.includes(token))) {
    return false
  }

  return processingStatusTokens.some((token) => normalized.includes(token))
}
