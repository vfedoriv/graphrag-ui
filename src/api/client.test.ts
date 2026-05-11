import { apiFetch, normalizeProblemDetail } from './client'

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
})
