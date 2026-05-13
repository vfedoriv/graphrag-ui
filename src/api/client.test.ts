import { apiFetch, normalizeProblemDetail } from './client'
import { ApiError } from './types'

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes problem detail field errors', () => {
    const err = normalizeProblemDetail(400, {
      title: 'Validation failed',
      detail: 'Invalid request',
      errors: { name: ['must not be blank'] },
    })

    expect(err.status).toBe(400)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Invalid request')
    expect(err.fieldErrors?.name[0]).toContain('must not be blank')
  })

  it('sends multipart body without content-type override', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"ok":true}',
    })
    vi.stubGlobal('fetch', fetchMock)

    const form = new FormData()
    form.append('file', new Blob(['abc']), 'a.txt')

    await apiFetch('/test', { method: 'POST', body: form })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
  })

  it('normalizes transport errors to ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiFetch('/test')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: 'Failed to fetch',
    })
    await expect(apiFetch('/test')).rejects.toBeInstanceOf(ApiError)
  })

  it('normalizes malformed successful json payload to ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{',
      }),
    )

    await expect(apiFetch('/test')).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      message: 'Received malformed JSON response from server',
    })
  })

  it('returns undefined for 204 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => '',
      }),
    )

    await expect(apiFetch('/test')).resolves.toBeUndefined()
  })

  it('returns undefined for successful empty response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      }),
    )

    await expect(apiFetch('/test')).resolves.toBeUndefined()
  })

  it('uses title as fallback message when detail is missing', () => {
    const err = normalizeProblemDetail(400, { title: 'Title only error' })
    expect(err.message).toBe('Title only error')
    expect(err.title).toBe('Title only error')
  })

  it('uses default fallback message when problem payload is null', () => {
    const err = normalizeProblemDetail(500, null)
    expect(err.message).toBe('Request failed')
    expect(err.status).toBe(500)
  })
})
