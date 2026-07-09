import { ApiError } from '../../api/types'

export function formatDocumentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const fieldMessages = error.fieldErrors
      ? Object.entries(error.fieldErrors).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
      : []
    return [error.message, ...(error.details ?? []), ...fieldMessages].filter(Boolean).join(' ')
  }
  return error instanceof Error ? error.message : 'Request failed'
}
