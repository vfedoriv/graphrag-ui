import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiProvidersPage } from './AiProvidersPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

const runtimeSettings = [
  {
    key: 'query.topK',
    category: 'query',
    valueType: 'INTEGER',
    currentValue: 5,
    defaultValue: 10,
    source: 'PERSISTED',
    mutable: true,
    liveApplied: true,
    sensitive: false,
    constraints: { min: 1, max: 20 },
    updateMode: 'LIVE',
    label: 'Query top K',
  },
  {
    key: 'openai.api-key',
    category: 'Provider',
    valueType: 'STRING',
    currentValue: 'Configured',
    defaultValue: 'Not configured',
    source: 'ENV',
    mutable: false,
    liveApplied: false,
    sensitive: true,
    constraints: null,
    updateMode: 'profile-managed',
    reason: 'Managed through AI profiles.',
    label: 'OpenAI API key',
  },
  {
    key: 'models.chat',
    category: 'models',
    valueType: 'STRING',
    currentValue: 'gpt-4.1-mini',
    defaultValue: 'gpt-4.1-mini',
    source: 'PROFILE',
    mutable: false,
    liveApplied: true,
    sensitive: false,
    constraints: null,
    updateMode: 'profile_managed',
    reason: 'Selected by the active profile.',
    label: 'Chat model',
  },
]

const profile = {
  id: 'default',
  name: 'Default profile',
  baseUrl: 'https://api.openai.com/v1',
  chatModel: 'gpt-4.1-mini',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  timeoutSeconds: 60,
  maxRetries: 3,
  defaultProfile: true,
  revision: 1,
  apiKeyConfigured: true,
  apiKeyMask: 'sk-...1234',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

function stubPageData() {
  return stubFetch((url) => {
    if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
    if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
    if (url.endsWith('/ai-profiles')) return jsonResponse(200, [profile])
    return jsonResponse(404, { detail: `Unexpected request: ${url}` })
  })
}

describe('AI Providers page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders only provider-owned settings with non-editable metadata and profile links', async () => {
    stubPageData()
    renderWithProviders(<AiProvidersPage />)

    const section = await screen.findByTestId('runtime-settings-section')
    expect(await within(section).findByText('OpenAI API key')).toBeInTheDocument()
    expect(within(section).getByText('Chat model')).toBeInTheDocument()
    expect(within(section).queryByText('Query top K')).not.toBeInTheDocument()
    expect(within(section).getByText('2 settings')).toBeInTheDocument()
    expect(within(section).queryByLabelText('Value for openai.api-key')).not.toBeInTheDocument()
    expect(within(section).getAllByText('profile-managed').length).toBeGreaterThan(0)
    expect(within(section).getAllByRole('link', { name: 'Manage through AI profiles' })[0]).toHaveAttribute('href', '/ai-providers#ai-profiles-section')
    expect(await screen.findByTestId('ai-profiles-section')).toBeInTheDocument()
  })

  it('filters the provider subset by category, update mode, and text', async () => {
    stubPageData()
    renderWithProviders(<AiProvidersPage />)
    const section = await screen.findByTestId('runtime-settings-section')
    await within(section).findByText('OpenAI API key')

    fireEvent.change(within(section).getByLabelText('Category'), { target: { value: 'Provider' } })
    expect(within(section).getByText('OpenAI API key')).toBeInTheDocument()
    expect(within(section).queryByText('Chat model')).not.toBeInTheDocument()

    fireEvent.change(within(section).getByLabelText('Category'), { target: { value: 'all' } })
    fireEvent.change(within(section).getByLabelText('Update mode'), { target: { value: 'profile_managed' } })
    expect(within(section).getByText('Chat model')).toBeInTheDocument()
    expect(within(section).queryByText('OpenAI API key')).not.toBeInTheDocument()

    fireEvent.change(within(section).getByLabelText('Update mode'), { target: { value: 'all' } })
    fireEvent.change(within(section).getByLabelText('Search'), { target: { value: 'api key' } })
    expect(within(section).getByText('OpenAI API key')).toBeInTheDocument()
    expect(within(section).queryByText('Chat model')).not.toBeInTheDocument()
  })

  it('keeps profiles usable when runtime settings fail', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings')) return jsonResponse(503, { detail: 'Settings offline' })
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [profile])
      return jsonResponse(404, {})
    })
    renderWithProviders(<AiProvidersPage />)

    expect(await screen.findByText(/Settings offline/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeEnabled()
  })

  it('keeps provider settings usable when profiles fail', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/ai-profiles')) return jsonResponse(503, { detail: 'Profiles offline' })
      return jsonResponse(404, {})
    })
    renderWithProviders(<AiProvidersPage />)

    expect(await screen.findByText('Profiles offline')).toBeInTheDocument()
    expect(await screen.findByText('OpenAI API key')).toBeInTheDocument()
  })

  it('renders independent empty states', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases') || url.endsWith('/runtime-settings') || url.endsWith('/ai-profiles')) {
        return jsonResponse(200, [])
      }
      return jsonResponse(404, {})
    })
    renderWithProviders(<AiProvidersPage />)

    expect(await screen.findByText('No runtime settings')).toBeInTheDocument()
    expect(await screen.findByText('No AI profiles')).toBeInTheDocument()
  })

  it('validates creation and surfaces profile mutation failures', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases') || url.endsWith('/runtime-settings')) return jsonResponse(200, [])
      if (url.endsWith('/ai-profiles') && !init?.method) return jsonResponse(200, [])
      if (url.endsWith('/ai-profiles') && init?.method === 'POST') return jsonResponse(400, { detail: 'Profile rejected' })
      return jsonResponse(404, {})
    })
    renderWithProviders(<AiProvidersPage />)
    const section = await screen.findByTestId('ai-profiles-section')

    await userEvent.click(within(section).getByRole('button', { name: 'Create profile' }))
    expect(fetchMock.mock.calls.some((call) => (call[1] as RequestInit | undefined)?.method === 'POST')).toBe(false)

    await userEvent.type(within(section).getByLabelText('Profile ID'), 'created')
    await userEvent.type(within(section).getByLabelText('Name'), 'Created')
    await userEvent.type(within(section).getByLabelText('Base URL'), 'https://example.test/v1')
    await userEvent.type(within(section).getByLabelText('Chat model'), 'chat')
    await userEvent.type(within(section).getByLabelText('Embedding model'), 'embed')
    await userEvent.click(within(section).getByRole('button', { name: 'Create profile' }))
    expect(await within(section).findByText('Profile rejected')).toBeInTheDocument()
  })

  it('creates, edits, replaces key, clears key, and deletes AI profiles', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases') || url.endsWith('/runtime-settings')) return jsonResponse(200, [])
      if (url.endsWith('/ai-profiles') && !init?.method) return jsonResponse(200, [profile])
      if (url.endsWith('/ai-profiles') && init?.method === 'POST') return jsonResponse(200, { ...profile, id: 'created' })
      if (url.endsWith('/ai-profiles/default') && init?.method === 'PUT') return jsonResponse(200, profile)
      if (url.endsWith('/ai-profiles/default') && init?.method === 'DELETE') {
        return { ok: true, status: 204, text: async () => '', json: async () => undefined }
      }
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderWithProviders(<AiProvidersPage />)

    const profilesSection = await screen.findByTestId('ai-profiles-section')
    await within(profilesSection).findByRole('button', { name: 'Edit' })
    await user.type(within(profilesSection).getByLabelText('Profile ID'), 'created')
    await user.type(within(profilesSection).getByLabelText('Name'), 'Created')
    await user.type(within(profilesSection).getByLabelText('Base URL'), 'https://example.test/v1')
    await user.type(within(profilesSection).getByLabelText('API key'), 'secret')
    await user.type(within(profilesSection).getByLabelText('Chat model'), 'chat')
    await user.type(within(profilesSection).getByLabelText('Embedding model'), 'embed')
    await user.click(within(profilesSection).getByRole('button', { name: 'Create profile' }))
    await waitFor(() => expect(fetchMock.mock.calls.some((call) => (call[1] as RequestInit | undefined)?.method === 'POST')).toBe(true))

    await user.click(within(profilesSection).getByRole('button', { name: 'Edit' }))
    const rowNameInput = within(profilesSection).getAllByLabelText('Name').find((input) => (input as HTMLInputElement).value === 'Default profile') as HTMLInputElement
    await user.clear(rowNameInput)
    await user.type(rowNameInput, 'Updated')
    await user.click(within(profilesSection).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(within(profilesSection).getByRole('button', { name: 'Edit' })).toBeInTheDocument())

    await user.click(within(profilesSection).getByRole('button', { name: 'Edit' }))
    await user.type(within(profilesSection).getByLabelText('Replacement API key for Default profile'), 'replacement')
    await user.click(within(profilesSection).getByRole('button', { name: 'Replace key' }))
    await waitFor(() => expect(within(profilesSection).getByRole('button', { name: 'Edit' })).toBeInTheDocument())

    await user.click(within(profilesSection).getByRole('button', { name: 'Edit' }))
    await user.click(within(profilesSection).getByRole('button', { name: 'Clear key' }))
    await waitFor(() => expect(within(profilesSection).getByRole('button', { name: 'Edit' })).toBeInTheDocument())
    await user.click(within(profilesSection).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(fetchMock.mock.calls.some((call) => (call[1] as RequestInit | undefined)?.method === 'DELETE')).toBe(true))
    expect(fetchMock.mock.calls.some((call) => String((call[1] as RequestInit | undefined)?.body).includes('"apiKey":"secret"'))).toBe(true)
    expect(fetchMock.mock.calls.some((call) => String((call[1] as RequestInit | undefined)?.body).includes('"apiKey":"replacement"'))).toBe(true)
    expect(fetchMock.mock.calls.some((call) => String((call[1] as RequestInit | undefined)?.body).includes('"clearApiKey":true'))).toBe(true)
  })
})
