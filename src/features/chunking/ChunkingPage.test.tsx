import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ChunkingState, RuntimeSetting } from '../../api/types'
import { ChunkingPage } from './ChunkingPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

const runtimeSettings: RuntimeSetting[] = [
  setting('app.chunking.strategy', 'recursive', { enum: ['recursive', 'fixed-character'] }),
  setting('app.chunking.target-tokens', 800, { min: 1, max: 2000 }),
  setting('app.chunking.overlap-tokens', 80, { min: 0, max: 800 }),
  setting('app.chunking.hard-character-limit', 4000, { min: 1, max: 10000 }),
  setting('app.chunking.parent-target-tokens', 1800, { min: 1, max: 5000 }),
  setting('app.chunking.parent-hard-character-limit', 8000, { min: 1, max: 20000 }),
  setting('app.chunking.parent-max-pages', 2, { min: 1, max: 2 }),
  setting('app.chunking.context-header-max-tokens', 64, { min: 0, max: 799 }),
  setting('app.chunking.context-header-max-characters', 256, { min: 0, max: 3999 }),
  setting('app.chunking.max-tokens', 900, { min: 1, max: 2000 }),
  setting('app.chunking.representation-revision', 'context-header-v1'),
]

const state: ChunkingState = {
  strategy: 'recursive',
  targetTokens: 800,
  overlapTokens: 80,
  hardCharacterLimit: 4000,
  parentTargetTokens: 1800,
  parentHardCharacterLimit: 8000,
  parentMaxPages: 2,
  contextHeaderMaxTokens: 64,
  contextHeaderMaxCharacters: 256,
  representationRevision: 'representation-v1',
  valueSources: {
    'app.chunking.strategy': 'DEFAULT',
    'app.chunking.target-tokens': 'PERSISTED',
    'app.chunking.overlap-tokens': 'DEFAULT',
    'app.chunking.hard-character-limit': 'DEFAULT',
    'app.chunking.parent-target-tokens': 'DEFAULT',
    'app.chunking.parent-hard-character-limit': 'DEFAULT',
    'app.chunking.parent-max-pages': 'DEFAULT',
    'app.chunking.context-header-max-tokens': 'DEFAULT',
    'app.chunking.context-header-max-characters': 'DEFAULT',
  },
  componentRevisions: {
    strategyRevision: 'strategy-v1',
    tokenizerPolicyRevision: 'tokenizer-policy-v1',
    tokenizerRevision: 'tokenizer-v1',
    parserPolicyRevision: 'parser-v1',
    representationRevision: 'representation-v1',
  },
  tokenizerId: 'cl100k_base',
  tokenizerRevision: 'tokenizer-v1',
  tokenCountMode: 'AUTHORITATIVE',
  parserPolicyRevision: 'parser-v1',
  settingsHash: 'settings-hash-a',
  effectiveChunkerRevision: 'chunker-v1',
  migrationLifecycle: 'CURRENT',
  compatibilityAliases: [{
    aliasKey: 'app.chunking.max-tokens',
    canonicalKey: 'app.chunking.target-tokens',
    configuredValue: 900,
    effectiveValue: 800,
    authoritative: false,
    precedence: 'canonical setting wins',
  }],
}

function setting(key: string, currentValue: unknown, constraints: Record<string, unknown> | null = null): RuntimeSetting {
  return {
    key,
    category: 'chunking',
    valueType: typeof currentValue === 'number' ? 'INTEGER' : 'STRING',
    currentValue,
    defaultValue: currentValue,
    source: 'PERSISTED',
    mutable: true,
    liveApplied: true,
    sensitive: false,
    constraints,
    updateMode: 'live',
    label: key,
    description: `Description for ${key}`,
  }
}

function setup(
  responder?: (url: string, init?: RequestInit) => ReturnType<typeof jsonResponse>,
) {
  return stubFetch(responder ?? ((url) => {
    if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
    if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
    if (url.endsWith('/chunking-state')) return jsonResponse(200, state)
    return jsonResponse(404, { detail: `Unexpected request: ${url}` })
  }))
}

describe('ChunkingPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders canonical controls in order with global scope, effective sources, revisions, lifecycle, and collapsed aliases', async () => {
    setup()
    renderWithProviders(<MemoryRouter><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: null })

    expect(await screen.findByText('Authoritative state loaded')).toBeInTheDocument()
    expect(screen.getByText('Scope: Global')).toBeInTheDocument()
    expect(screen.getByText('Source: PERSISTED')).toBeInTheDocument()
    expect(screen.getByText('Settings hash')).toBeInTheDocument()
    expect(screen.getByText('settings-hash-a')).toBeInTheDocument()
    expect(screen.getByText('cl100k_base')).toBeInTheDocument()
    expect(screen.getByText('AUTHORITATIVE')).toBeInTheDocument()
    expect(screen.getAllByText('chunker-v1')).toHaveLength(2)
    expect(screen.getAllByText('CURRENT')).toHaveLength(3)

    const cards = screen.getAllByTestId(/^chunking-control-/)
    expect(cards.map((card) => card.getAttribute('data-testid'))).toEqual([
      'chunking-control-strategy',
      'chunking-control-targetTokens',
      'chunking-control-overlapTokens',
      'chunking-control-hardCharacterLimit',
      'chunking-control-parentTargetTokens',
      'chunking-control-parentHardCharacterLimit',
      'chunking-control-parentMaxPages',
      'chunking-control-contextHeaderMaxTokens',
      'chunking-control-contextHeaderMaxCharacters',
    ])
    expect(screen.getByText('Compatibility aliases (1)')).toBeInTheDocument()
    expect(screen.getByText('Compatibility aliases (1)').closest('details')).not.toHaveAttribute('open')
  })

  it('stages valid edits, submits changed canonical values atomically, refetches both sources, and offers reprocessing without calling migration APIs', async () => {
    let runtimeReads = 0
    let stateReads = 0
    const fetchMock = setup((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings') && init?.method === 'PUT') {
        return jsonResponse(200, [{ ...runtimeSettings[1], currentValue: 900 }])
      }
      if (url.endsWith('/runtime-settings')) {
        runtimeReads += 1
        return jsonResponse(200, runtimeReads > 1 ? runtimeSettings.map((item) => item.key === 'app.chunking.target-tokens' ? { ...item, currentValue: 900 } : item) : runtimeSettings)
      }
      if (url.endsWith('/chunking-state')) {
        stateReads += 1
        return jsonResponse(200, stateReads > 1 ? { ...state, targetTokens: 900, effectiveChunkerRevision: 'chunker-v2', settingsHash: 'settings-hash-b' } : state)
      }
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter><ChunkingPage /></MemoryRouter>)

    const page = await screen.findByTestId('chunking-controller-page')
    const input = await within(page).findByLabelText('Draft for app.chunking.target-tokens')
    fireEvent.change(input, { target: { value: '900' } })
    expect(within(page).getByText('Draft')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/runtime-settings') && init?.method === 'PUT')).toBe(false)

    await user.click(within(page).getByRole('button', { name: 'Apply strategy changes' }))

    expect(await within(page).findByText('1 chunk setting accepted')).toBeInTheDocument()
    expect(await within(page).findByText('Existing document chunks were not changed')).toBeInTheDocument()
    expect(within(page).getByRole('link', { name: 'Review Reprocessing' })).toHaveAttribute('href', '/chunking?view=reprocessing')
    expect(within(page).queryByText('Draft')).not.toBeInTheDocument()
    const putCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/runtime-settings') && init?.method === 'PUT')
    expect(putCall?.[1]).toMatchObject({ body: JSON.stringify({ updates: [{ key: 'app.chunking.target-tokens', value: 900 }] }) })
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/chunk-migrations/'))).toBe(false)
  })

  it('uses backend numeric constraints before submitting and retains rejected drafts', async () => {
    let putCalls = 0
    const fetchMock = setup((url, init) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings') && init?.method === 'PUT') {
        putCalls += 1
        return jsonResponse(400, { title: 'Invalid setting', detail: 'Value is outside allowed range' })
      }
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/chunking-state')) return jsonResponse(200, state)
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter><ChunkingPage /></MemoryRouter>)

    const page = await screen.findByTestId('chunking-controller-page')
    const input = await within(page).findByLabelText('Draft for app.chunking.target-tokens')
    fireEvent.change(input, { target: { value: '-1' } })
    expect(await within(page).findByText('Must be at least 1.')).toBeInTheDocument()
    expect(within(page).getByRole('button', { name: 'Apply strategy changes' })).toBeDisabled()

    fireEvent.change(input, { target: { value: '900' } })
    await user.click(within(page).getByRole('button', { name: 'Apply strategy changes' }))
    expect(await within(page).findByText('Value is outside allowed range')).toBeInTheDocument()
    expect((within(page).getByLabelText('Draft for app.chunking.target-tokens') as HTMLInputElement).value).toBe('900')
    expect(within(page).getByText('Draft')).toBeInTheDocument()
    expect(putCalls).toBe(1)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/chunk-migrations/'))).toBe(false)
  })

  it('keeps canonical settings read-only when runtime metadata marks them immutable', async () => {
    const immutableSettings = runtimeSettings.map((item) => item.key === 'app.chunking.parent-max-pages' ? { ...item, mutable: false, reason: 'Managed by deployment policy.' } : item)
    setup((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, immutableSettings)
      if (url.endsWith('/chunking-state')) return jsonResponse(200, state)
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })
    renderWithProviders(<MemoryRouter><ChunkingPage /></MemoryRouter>)

    const card = await screen.findByTestId('chunking-control-parentMaxPages')
    expect(await within(card).findByText('Read-only')).toBeInTheDocument()
    expect(await within(card).findByText('Managed by deployment policy.')).toBeInTheDocument()
    expect(within(card).queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('keeps runtime and aggregate source failures separate', async () => {
    setup((url) => {
      if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [])
      if (url.endsWith('/runtime-settings')) return jsonResponse(200, runtimeSettings)
      if (url.endsWith('/chunking-state')) return jsonResponse(503, { detail: 'Chunking aggregate unavailable' })
      return jsonResponse(404, { detail: `Unexpected request: ${url}` })
    })
    renderWithProviders(<MemoryRouter><ChunkingPage /></MemoryRouter>)

    expect(await screen.findByText('Chunking state unavailable')).toBeInTheDocument()
    expect(screen.getByText(/Runtime values below are not authoritative combined state/)).toBeInTheDocument()
    expect(screen.queryByText('Runtime settings unavailable')).not.toBeInTheDocument()
    expect(screen.getByText('app.chunking.strategy')).toBeInTheDocument()
  })
})
