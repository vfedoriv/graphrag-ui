import { ApiError, type ProblemDetail } from './types'

const API_BASE = '/api/v1'

function normalizeErrors(errors: ProblemDetail['errors']): { fieldErrors?: Record<string, string[]>, details?: string[] } {
  if (!errors) return {}

  if (Array.isArray(errors)) {
    return { details: errors.map(String) }
  }

  if (typeof errors !== 'object') return {}

  const fieldErrors: Record<string, string[]> = {}
  for (const [field, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      fieldErrors[field] = value.map(String)
    } else if (typeof value === 'string') {
      fieldErrors[field] = [value]
    }
  }

  return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}
}

export function normalizeProblemDetail(status: number, problem: ProblemDetail | null): ApiError {
  const { fieldErrors, details } = normalizeErrors(problem?.errors)

  return new ApiError({
    status,
    title: problem?.title ? String(problem.title) : undefined,
    message: (problem?.detail ? String(problem.detail) : problem?.title ? String(problem.title) : 'Request failed'),
    fieldErrors,
    details,
    problemDetail: problem,
  })
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ProblemDetail | null
  try {
    payload = (await response.json()) as ProblemDetail
  } catch {
    payload = null
  }
  return normalizeProblemDetail(response.status, payload)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    })
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Network request failed'
    throw new ApiError({ status: 0, message })
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError({
      status: response.status,
      message: 'Received malformed JSON response from server',
    })
  }
}

export function toJsonBody(input: unknown): string {
  return JSON.stringify(input)
}
