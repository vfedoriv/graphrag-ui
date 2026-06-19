import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPage } from './SettingsPage'
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
    description: 'Hybrid search hit count.',
  },
  {
    key: 'index.batchSize',
    category: 'indexing',
    valueType: 'INTEGER',
    currentValue: 100,
    defaultValue: 50,
    source: 'DEFAULT',
    mutable: true,
    liveApplied: false,
    sensitive: false,
    constraints: { min: 10, max: 500 },
    updateMode: 'RESTART_REQUIRED',
    label: 'Index batch size',
    description: 'Batch size applied on restart.',
  },
  {
    key: 'openai.api-key',
    category: 'provider',
    valueType: 'STRING',
    currentValue: 'Configured',
    defaultValue: 'Not configured',
    source: 'ENV',
    mutable: false,
    liveApplied: false,
    sensitive: true,
    constraints: null,
    updateMode: 'PROFILE_MANAGED',
    reason: 'Managed through AI profiles.',
    label: 'OpenAI API key',
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
  retryCount: 3,
  defaultProfile: true,
  revision: 1,
  apiKeyConfigured: true,
  apiKeyMask: 'sk-...1234',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

describe('settings page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders and filters runtime settings while protecting sensitive values', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) {
        return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, activeAiProfileId: 'default', createdAt: '' }])
      }
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [profile])
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('Query top K')).toBeInTheDocument()
    expect(screen.getByText('OpenAI API key')).toBeInTheDocument()
    expect(screen.getAllByText(/Managed through AI profiles/i).length).toBeGreaterThan(0)
    expect(within(screen.getByTestId('runtime-settings-section')).getByText('Configured')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'top k' } })
    expect(screen.getByText('Query top K')).toBeInTheDocument()
    expect(screen.queryByText('OpenAI API key')).not.toBeInTheDocument()
  })

  it('stages mutable settings locally and applies only changed values in one bulk request', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings') && !init?.method) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/runtime-settings') && init?.method === 'PUT') {
        return jsonResponse(200, [{ ...runtimeSettings[0], currentValue: 12 }])
      }
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [])
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />)

    const section = await screen.findByTestId('runtime-settings-section')
    const input = await within(section).findByLabelText('Value for query.topK')
    fireEvent.change(input, { target: { value: '12' } })
    expect(within(section).getByText('Modified')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith('/runtime-settings/query.topK') && (call[1] as RequestInit | undefined)?.method === 'PUT')).toBe(false)

    await userEvent.click(within(section).getByRole('button', { name: 'Apply changes' }))
    expect(await within(section).findByText('1 runtime setting accepted')).toBeInTheDocument()

    const bulkCall = fetchMock.mock.calls.find((call) => String(call[0]).endsWith('/runtime-settings') && (call[1] as RequestInit | undefined)?.method === 'PUT')
    expect(bulkCall?.[1]).toMatchObject({ body: JSON.stringify({ updates: [{ key: 'query.topK', value: 12 }] }) })
  })

  it('edits restart-required settings and shows active, drafted, and accepted pending values separately', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings') && !init?.method) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/runtime-settings') && init?.method === 'PUT') {
        return jsonResponse(200, [{ ...runtimeSettings[1], currentValue: 100 }])
      }
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [])
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />)

    const section = await screen.findByTestId('runtime-settings-section')
    fireEvent.change(await within(section).findByLabelText('Value for index.batchSize'), { target: { value: '200' } })

    expect(within(section).getByText('Draft pending restart')).toBeInTheDocument()
    expect(within(section).getByText('Restart required before active')).toBeInTheDocument()
    expect(within(section).getByText('100')).toBeInTheDocument()

    await userEvent.click(within(section).getByRole('button', { name: 'Apply changes' }))

    expect(await within(section).findByText('Accepted pending restart')).toBeInTheDocument()
    expect(within(section).getByText('200')).toBeInTheDocument()
    const bulkCall = fetchMock.mock.calls.find((call) => String(call[0]).endsWith('/runtime-settings') && (call[1] as RequestInit | undefined)?.method === 'PUT')
    expect(bulkCall?.[1]).toMatchObject({ body: JSON.stringify({ updates: [{ key: 'index.batchSize', value: 200 }] }) })
  })

  it('keeps rejected bulk drafts and modified markers after an atomic apply failure', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings') && !init?.method) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/runtime-settings') && init?.method === 'PUT') {
        return jsonResponse(400, { title: 'Invalid setting', detail: 'Batch size is outside allowed range' })
      }
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [])
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />)

    const section = await screen.findByTestId('runtime-settings-section')
    const input = await within(section).findByLabelText('Value for index.batchSize')
    fireEvent.change(input, { target: { value: '900' } })
    await userEvent.click(within(section).getByRole('button', { name: 'Apply changes' }))

    expect(await within(section).findByText('Batch size is outside allowed range')).toBeInTheDocument()
    expect((within(section).getByLabelText('Value for index.batchSize') as HTMLInputElement).value).toBe('900')
    expect(within(section).getByText('Modified')).toBeInTheDocument()
    expect(within(section).getByText('100')).toBeInTheDocument()
  })

  it('clears mutable restart-required settings while preserving restart messaging', async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings') && !init?.method) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/runtime-settings/index.batchSize') && init?.method === 'DELETE') {
        return jsonResponse(200, { ...runtimeSettings[1], currentValue: 100, defaultValue: 50 })
      }
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [])
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />)

    const section = await screen.findByTestId('runtime-settings-section')
    const clearButtons = await within(section).findAllByRole('button', { name: 'Clear' })
    await userEvent.click(clearButtons[1])

    expect(await within(section).findByText('Override clear accepted')).toBeInTheDocument()
    expect(within(section).getByText('Accepted pending restart')).toBeInTheDocument()
    expect(within(section).getByText('Restart required before active')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith('/runtime-settings/index.batchSize') && (call[1] as RequestInit | undefined)?.method === 'DELETE')).toBe(true)
  })

  it('keeps sensitive and profile-managed runtime settings non-editable', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/ai-profiles')) return jsonResponse(200, [])
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />)

    const section = await screen.findByTestId('runtime-settings-section')
    await within(section).findByText('OpenAI API key')
    expect(within(section).queryByLabelText('Value for openai.api-key')).not.toBeInTheDocument()
    expect(within(section).getAllByText(/Managed through AI profiles/i).length).toBeGreaterThan(0)
    expect(within(section).getAllByText('PROFILE_MANAGED').length).toBeGreaterThan(0)
  })

  it('creates, edits, replaces key, clears key, and deletes AI profiles', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, [])
      if (url.endsWith('/ai-profiles') && !init?.method) return jsonResponse(200, [profile])
      if (url.endsWith('/ai-profiles') && init?.method === 'POST') return jsonResponse(200, { ...profile, id: 'created' })
      if (url.endsWith('/ai-profiles/default') && init?.method === 'PUT') return jsonResponse(200, profile)
      if (url.endsWith('/ai-profiles/default') && init?.method === 'DELETE') {
        return { ok: true, status: 204, text: async () => '', json: async () => undefined }
      }
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<SettingsPage />)

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
    const replacementInput = within(profilesSection).getByLabelText('Replacement API key for Default profile')
    await user.type(replacementInput, 'replacement')
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
