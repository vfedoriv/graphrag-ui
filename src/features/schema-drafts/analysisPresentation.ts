export const legacyAnalysisValue = 'Unavailable for legacy run'
export const legacyFailureCode = 'Unavailable for legacy outcome'

const failureCodeLabels: Record<string, string> = {
  SOURCE_DEADLINE_EXCEEDED: 'Source deadline exceeded',
  REQUEST_DEADLINE_EXCEEDED: 'Request deadline exceeded',
  TRANSPORT_TIMEOUT: 'Transport timeout',
  TRANSPORT_IO: 'Transport I/O failure',
  RATE_LIMIT: 'Rate limit',
  PROVIDER_RETRYABLE_STATUS: 'Retryable provider status',
  PROVIDER_5XX: 'Provider server error',
  PROVIDER_AUTH: 'Provider authentication failure',
  PROVIDER_INVALID_REQUEST: 'Provider rejected request',
  PROVIDER_ERROR: 'Provider error',
  EMPTY_MODEL_RESPONSE: 'Empty model response',
  MALFORMED_MODEL_RESPONSE: 'Malformed model response',
  INVALID_MODEL_CANDIDATE: 'Invalid model candidate',
  SOURCE_STALE: 'Source changed',
  SOURCE_UNAVAILABLE: 'Source unavailable',
  CONFIGURATION_ERROR: 'Configuration error',
}

export function formatCapturedConcurrency(value: number | null) {
  if (value === null) return legacyAnalysisValue
  return `${value} source${value === 1 ? '' : 's'} at a time`
}

export function formatDurationMillis(value: number | null) {
  if (value === null) return legacyAnalysisValue
  if (value < 1000) return `${value} ms`
  if (value % 60_000 === 0) {
    const minutes = value / 60_000
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  if (value % 1000 === 0) {
    const seconds = value / 1000
    return `${seconds} second${seconds === 1 ? '' : 's'}`
  }
  return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} seconds`
}

export function formatFailureCode(value: string | null) {
  if (value === null) return legacyFailureCode
  const label = failureCodeLabels[value] ?? value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (character) => character.toUpperCase())
  return `${label} (${value})`
}
