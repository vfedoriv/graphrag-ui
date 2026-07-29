import { fireEvent, screen, within } from '@testing-library/react'
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
    updateMode: 'profile-managed',
    reason: 'Managed through AI profiles.',
    label: 'OpenAI API key',
  },
]

describe('settings page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders and filters only non-provider runtime settings without loading AI profiles', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.endsWith('/knowledge-bases')) {
        return jsonResponse(200, [{ id: 'kb-a', name: 'KB A', activeSchemaId: null, activeAiProfileId: 'default', createdAt: '' }])
      }
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })

    renderWithProviders(<SettingsPage />, { selectedKnowledgeBaseId: 'kb-a' })

    expect(await screen.findByText('Query top K')).toBeInTheDocument()
    expect(screen.queryByText('OpenAI API key')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ai-profiles-section')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith('/ai-profiles'))).toBe(false)
    expect(within(screen.getByTestId('runtime-settings-section')).getByText('2 settings')).toBeInTheDocument()

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

})
