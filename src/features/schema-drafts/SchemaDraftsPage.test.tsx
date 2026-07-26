import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SchemaDraftsPage } from './SchemaDraftsPage'
import { analysisDetailFixture, analysisHistoryFixture, candidateFixture, candidatePageFixture, draftFixture, legacyAnalysisDetailFixture } from './schemaDraftFixtures'
import type { AnalysisRunResponse, AnalysisRunSummaryResponse, CandidateResponse, ConflictResponse, DraftResponse, PageResponse } from './schemaDraftTypes'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

afterEach(() => vi.restoreAllMocks())

function renderRoute(path: string, selectedKnowledgeBaseId: string | null) {
  return renderWithProviders(<MemoryRouter initialEntries={[path]}><Routes><Route path='/schema-drafts' element={<SchemaDraftsPage />} /><Route path='/schema-drafts/:draftId' element={<SchemaDraftsPage />} /></Routes></MemoryRouter>, { selectedKnowledgeBaseId })
}

const conflictFixture = (overrides: Partial<ConflictResponse> = {}): ConflictResponse => ({
  id: 'conflict-1',
  type: 'PROPERTY_TYPE',
  coordinate: 'Customer.age',
  alternatives: ['STRING', 'INTEGER'],
  evidence: [],
  resolved: false,
  selectedAlternative: null,
  customResolution: null,
  aggregateRevisionId: 'aggregate-1',
  current: true,
  createdAt: '2026-07-15T08:03:00Z',
  resolvedAt: null,
  ...overrides,
})

const draftCandidate = (identity: string, overrides: Partial<CandidateResponse> = {}): CandidateResponse => ({
  ...candidateFixture,
  identity,
  evidence: [],
  latestDecisionId: null,
  ...overrides,
})

function stubAnalysisWorkbench(
  detail: AnalysisRunResponse,
  draftOverrides: Partial<DraftResponse> = {},
  historyItems: AnalysisRunSummaryResponse[] = [{
    ...analysisHistoryFixture.content[1],
    id: detail.id,
    status: detail.status,
    retryable: detail.retryable,
    canRetry: detail.canRetry,
  }],
) {
  const draft = {
    ...draftFixture,
    currentAnalysis: { id: detail.id, status: detail.status, current: detail.currentResult, statusLocation: `/runs/${detail.id}` },
    ...draftOverrides,
  }
  const history: PageResponse<AnalysisRunSummaryResponse> = {
    page: 0,
    size: 10,
    totalElements: historyItems.length,
    content: historyItems,
  }
  return stubFetch((url) => {
    const path = new URL(url, 'http://test').pathname
    if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draft)
    if (path.endsWith('/analysis-runs')) return jsonResponse(200, history)
    if (path.includes('/analysis-runs/')) return jsonResponse(200, detail)
    return jsonResponse(200, [])
  })
}

describe('SchemaDraftsPage', () => {
  it('does not request drafts without a selected knowledge base', () => {
    const fetchMock = stubFetch(() => jsonResponse(500, {}))
    renderRoute('/schema-drafts', null)
    expect(screen.getByText('No knowledge base selected')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('presents each draft target as an identifiable link to its workbench', async () => {
    stubFetch((url) => jsonResponse(200, url.endsWith('/schema-drafts') ? [draftFixture] : []))
    renderRoute('/schema-drafts', 'kb-1')

    const targetLink = await screen.findByRole('link', { name: 'Support v2' })
    expect(targetLink).toHaveAttribute('href', '/schema-drafts/draft-1')
    expect(targetLink).toHaveClass('schema-draft-target-link')
  })

  it('renders a published deep link as read-only', async () => {
    stubFetch((url) => jsonResponse(200, url.endsWith('/draft-1') ? { ...draftFixture, status: 'PUBLISHED' } : []))
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    expect(await screen.findByText(/Published read-only audit resource/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete draft' })).not.toBeInTheDocument()
  })

  it('loads each workbench section with scalable server-owned data', async () => {
    const source = { id: 'source-1', type: 'DOCUMENT', status: 'STALE', revision: 1, documentId: 'doc-1', name: 'Document one', contentType: 'text/plain', sizeBytes: 42, sha256: 'sha', analyzed: true, createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T08:01:00Z' }
    const decision = { id: 'decision-4', sequence: 4, draftRevision: 7, type: 'PIN', reviewState: 'PINNED', candidateIdentity: candidatePageFixture.content[0].identity, priorValue: null, resultingValue: candidatePageFixture.content[0], rationale: 'Stable identifier', createdAt: '2026-07-15T08:02:00Z' }
    const conflict = { id: 'conflict-1', type: 'PROPERTY_TYPE', coordinate: 'Customer.age', alternatives: ['STRING', 'INTEGER'], evidence: [], resolved: false, selectedAlternative: null, customResolution: null, aggregateRevisionId: 'aggregate-1', current: true, createdAt: '2026-07-15T08:03:00Z', resolvedAt: null }
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/schema-drafts/draft-1/sources')) return jsonResponse(200, [source])
      if (path.endsWith('/documents')) return jsonResponse(200, [])
      if (path.endsWith('/analysis-runs/run-running')) return jsonResponse(200, { ...analysisDetailFixture, id: 'run-running', status: 'COMPLETED' })
      if (path.endsWith('/analysis-runs')) return jsonResponse(200, analysisHistoryFixture)
      if (path.endsWith('/candidates')) return jsonResponse(200, candidatePageFixture)
      if (path.endsWith('/decisions')) return jsonResponse(200, [decision])
      if (path.endsWith('/conflicts')) return jsonResponse(200, [conflict])
      if (path.endsWith('/projection')) return jsonResponse(200, { aggregateRevisionId: 'aggregate-1', draftRevision: 7, schema: { nodes: [{ label: 'Customer' }] }, publicationReady: false })
      if (path.endsWith('/diff')) return jsonResponse(200, { aggregateRevisionId: 'aggregate-1', draftRevision: 7, baseline: { type: 'BASE_SCHEMA', id: 'schema-1', contentHash: 'base-schema-sha' }, changes: [{ coordinate: 'Customer.age', compatibility: 'BREAKING', operation: 'CHANGE_TYPE', before: 'STRING', after: 'INTEGER' }] })
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    expect(await screen.findByText('Support v2')).toBeInTheDocument()
    expect(screen.getByRole('tablist')).toHaveClass('tabs')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveClass('tab', 'active')
    expect(screen.getByRole('tab', { name: 'Sources' })).toHaveClass('tab')

    await user.click(screen.getByRole('tab', { name: 'Sources' }))
    expect(screen.getByRole('tab', { name: 'Sources' })).toHaveClass('active')
    expect(await screen.findByText('Document one')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Analysis' }))
    expect(await screen.findByText('Recent analysis history')).toBeInTheDocument()
    expect((await screen.findAllByText(/2\/3 succeeded/)).length).toBeGreaterThan(0)
    expect(screen.getByText('Page 1 · 3 items total')).toBeInTheDocument()
    expect(screen.getByText('Page 1 · 4 items total')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Candidates' }))
    await user.click(await screen.findByText('Customer.customerId'))
    expect(screen.getByText('Page 1 · 1 items total')).toBeInTheDocument()
    expect((await screen.findAllByText('Recommended')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pinned').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'Conflicts' }))
    expect(await screen.findByText('Customer.age')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Projection' }))
    expect(await screen.findByText('Projection is derived')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Projected schema' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByLabelText('Mock structured JSON data')).toBeDisabled()
    expect(screen.getByLabelText('Mock structured JSON data')).toHaveValue(JSON.stringify({ nodes: [{ label: 'Customer' }] }, null, 2))
    await user.click(screen.getByRole('button', { name: 'Structured JSON' }))
    expect(screen.queryByRole('group', { name: 'Projected schema' })).not.toBeInTheDocument()
    expect(screen.getByText(/"nodes"/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Readable view' }))
    expect(screen.getByRole('group', { name: 'Projected schema' })).toBeInTheDocument()
    expect(screen.getByLabelText('Mock structured JSON data')).toHaveValue(JSON.stringify({ nodes: [{ label: 'Customer' }] }, null, 2))

    await user.click(screen.getByRole('tab', { name: 'Diff' }))
    expect(await screen.findByText(/Base schema schema-1/)).toBeInTheDocument()
    const diffCoordinate = await screen.findByText('Customer.age')
    expect(within(diffCoordinate.closest('summary')!).getByText('Change type')).toBeInTheDocument()
    expect(screen.queryByText('Before')).not.toBeInTheDocument()
    await user.click(diffCoordinate)
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
  })

  it.each([
    { retryable: true, canRetry: true, shown: true },
    { retryable: false, canRetry: true, shown: true },
    { retryable: true, canRetry: false, shown: false },
    { retryable: false, canRetry: false, shown: false },
  ])('uses canRetry=$canRetry for Retry while preserving retryable=$retryable diagnostics', async ({ retryable, canRetry, shown }) => {
    const detail = { ...analysisDetailFixture, retryable, canRetry }
    stubAnalysisWorkbench(detail)
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Analysis' }))

    await screen.findByText('Captured execution policy')
    expect(screen.queryByRole('button', { name: 'Retry analysis' }) !== null).toBe(shown)
    const diagnostic = retryable ? 'No failure category · retryable' : 'No failure category · not retryable'
    expect(screen.getByText((_, element) => element?.tagName === 'SMALL' && element.textContent === diagnostic)).toBeInTheDocument()
  })

  it('keeps Start unavailable after selecting history while another analysis is active', async () => {
    const activeSummary = { ...analysisHistoryFixture.content[0], canRetry: false }
    const historicalSummary = { ...analysisHistoryFixture.content[1], canRetry: false }
    const historicalDetail = { ...analysisDetailFixture, canRetry: false }
    const draft = {
      ...draftFixture,
      currentAnalysis: { id: activeSummary.id, status: 'RUNNING' as const, current: true, statusLocation: `/runs/${activeSummary.id}` },
    }
    const history = { ...analysisHistoryFixture, size: 10, totalElements: 2, content: [activeSummary, historicalSummary] }
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draft)
      if (path.endsWith('/analysis-runs')) return jsonResponse(200, history)
      if (path.endsWith(`/analysis-runs/${historicalSummary.id}`)) return jsonResponse(200, historicalDetail)
      if (path.endsWith(`/analysis-runs/${activeSummary.id}`)) return jsonResponse(200, { ...analysisDetailFixture, id: activeSummary.id, status: 'RUNNING', canRetry: false, completedAt: null })
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Analysis' }))
    await user.click(await screen.findByRole('button', { name: historicalSummary.id }))

    expect(await screen.findByText(`Run ${historicalDetail.id} · current`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start analysis' })).toBeDisabled()
    expect(screen.getByText('Analysis active')).toBeInTheDocument()
  })

  it('shows captured budgets and detailed deadline failure diagnostics', async () => {
    stubAnalysisWorkbench(analysisDetailFixture)
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Analysis' }))

    expect((await screen.findAllByText('4 sources at a time')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('1 minute').length).toBeGreaterThan(0)
    expect(screen.getAllByText('3 minutes').length).toBeGreaterThan(0)
    expect(screen.getByText('TIMEOUT')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.tagName === 'SMALL' && element.textContent === 'Source deadline exceeded (SOURCE_DEADLINE_EXCEEDED) · Retryable failure')).toBeInTheDocument()
  })

  it('shows unavailable legacy budgets and failure codes without substituting settings', async () => {
    stubAnalysisWorkbench(legacyAnalysisDetailFixture)
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Analysis' }))

    expect((await screen.findAllByText('Unavailable for legacy run')).length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText((_, element) => element?.tagName === 'SMALL' && element.textContent === 'Unavailable for legacy outcome · Retryable failure')).toBeInTheDocument()
  })

  it('falls back safely for an unknown future source failure code', async () => {
    const sourceOutcomes = {
      ...analysisDetailFixture.sourceOutcomes,
      content: analysisDetailFixture.sourceOutcomes.content.map((outcome, index) => index === 1
        ? { ...outcome, failureCode: 'FUTURE_PROVIDER_SIGNAL' }
        : outcome),
    }
    stubAnalysisWorkbench({ ...analysisDetailFixture, sourceOutcomes })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Analysis' }))

    expect(await screen.findByText((_, element) => element?.tagName === 'SMALL' && element.textContent === 'Future provider signal (FUTURE_PROVIDER_SIGNAL) · Retryable failure')).toBeInTheDocument()
  })

  it('explains discovery evidence before upload and preserves the draft file-source request', async () => {
    const source = { id: 'source-file', type: 'FILE', status: 'ACTIVE', revision: 1, documentId: null, name: 'evidence.txt', contentType: 'text/plain', sizeBytes: 8, sha256: 'sha', analyzed: false, createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T08:00:00Z' }
    const fetchMock = stubFetch((url, init) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1/sources/files') && init?.method === 'POST') return jsonResponse(200, source)
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/schema-drafts/draft-1/sources')) return jsonResponse(200, [])
      if (path.endsWith('/documents')) return jsonResponse(200, [])
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Sources' }))

    expect(screen.getByRole('heading', { name: 'Discovery evidence file' })).toBeInTheDocument()
    expect(screen.getByText(/influences schema discovery.*stays private.*does not enter Documents/i)).toBeInTheDocument()
    expect(screen.getByText(/cannot be used as a held-out evaluation document/i)).toBeInTheDocument()

    const file = new File(['evidence'], 'evidence.txt', { type: 'text/plain' })
    await user.upload(screen.getByLabelText('Discovery evidence file'), file)
    await user.click(screen.getByRole('button', { name: 'Upload discovery evidence' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/schema-drafts/draft-1/sources/files?revision=7') && init?.method === 'POST')
      expect(call).toBeDefined()
      expect(call?.[1]?.body).toBeInstanceOf(FormData)
      expect((call?.[1]?.body as FormData).get('file')).toBe(file)
    })
  })

  it('shows projection guidance without requesting projection data when no current aggregate exists', async () => {
    const fetchMock = stubFetch((url) => jsonResponse(200, url.endsWith('/draft-1') ? { ...draftFixture, currentAggregateId: null } : []))
    const user = userEvent.setup()

    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Projection' }))

    expect(screen.getByText('No current projection')).toBeInTheDocument()
    expect(screen.getByText('Add sources and run analysis to produce an effective projection.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/projection'))).toBe(false)
  })

  it('presents conflicts as a compact unresolved-first queue with one focused workflow', async () => {
    const conflicts = [
      conflictFixture({ id: 'resolved', coordinate: 'Customer.name', resolved: true, selectedAlternative: 'STRING', resolvedAt: '2026-07-15T09:00:00Z' }),
      conflictFixture({ id: 'unresolved-1', coordinate: 'Customer.age', evidence: [{ sourceId: 'hidden-source-one' }] }),
      conflictFixture({ id: 'unresolved-2', coordinate: 'Customer.status', type: 'ALIAS', evidence: [{ sourceId: 'hidden-source-two' }] }),
    ]
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/conflicts')) return jsonResponse(200, conflicts)
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Conflicts' }))

    const items = await screen.findAllByRole('article')
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Customer.age'),
      expect.stringContaining('Customer.status'),
      expect.stringContaining('Customer.name'),
    ])
    expect(screen.queryByRole('textbox', { name: /Custom resolution/ })).not.toBeInTheDocument()
    expect(screen.queryByText('hidden-source-one')).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Review conflict' })[0])
    expect(screen.getByText('How do you want to resolve this conflict?')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Review conflict' })[0])
    expect(screen.getAllByText('How do you want to resolve this conflict?')).toHaveLength(1)
    expect(screen.getByText('Customer.status').closest('article')).toHaveClass('active')
  })

  it('submits the exact backend identifier for a suggested conflict value', async () => {
    const conflict = conflictFixture({ alternatives: { stringChoice: 'STRING', integerChoice: 'INTEGER' } })
    let resolved = false
    const fetchMock = stubFetch((url, init) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/resolution') && init?.method === 'POST') {
        resolved = true
        return jsonResponse(200, { ...conflict, resolved: true, selectedAlternative: 'integerChoice', resolvedAt: '2026-07-15T09:00:00Z' })
      }
      if (path.endsWith('/conflicts')) return jsonResponse(200, [{ ...conflict, resolved, selectedAlternative: resolved ? 'integerChoice' : null }])
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Conflicts' }))
    await user.click(await screen.findByRole('button', { name: 'Review conflict' }))
    await user.click(screen.getByRole('radio', { name: 'INTEGER' }))
    await user.type(screen.getByRole('textbox', { name: 'Optional rationale for Customer.age' }), 'Prefer numeric ages')
    await user.click(screen.getByRole('button', { name: 'Resolve conflict' }))

    const resolutionCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/resolution') && init?.method === 'POST')
    expect(JSON.parse(String(resolutionCall?.[1]?.body))).toEqual({ revision: 7, selectedAlternative: 'integerChoice', rationale: 'Prefer numeric ages' })
  })

  it('switches to a validated custom resolution and sends no suggested value', async () => {
    const conflict = conflictFixture()
    const fetchMock = stubFetch((url, init) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/resolution') && init?.method === 'POST') return jsonResponse(200, { ...conflict, resolved: true, customResolution: { type: 'DATE' }, resolvedAt: '2026-07-15T09:00:00Z' })
      if (path.endsWith('/conflicts')) return jsonResponse(200, [conflict])
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Conflicts' }))
    await user.click(await screen.findByRole('button', { name: 'Review conflict' }))
    await user.click(screen.getByRole('radio', { name: 'STRING' }))
    await user.click(screen.getByRole('radio', { name: /Enter a custom value/ }))
    expect(screen.queryByRole('radio', { name: 'STRING' })).not.toBeInTheDocument()

    const editor = screen.getByRole('textbox', { name: 'Custom resolution for Customer.age' })
    await user.type(editor, 'not json')
    expect(screen.getByText('Enter a valid JSON value.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolve conflict' })).toBeDisabled()
    await user.clear(editor)
    await user.click(editor)
    await user.paste('{"type":"DATE"}')
    await user.click(screen.getByRole('button', { name: 'Resolve conflict' }))

    const resolutionCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/resolution') && init?.method === 'POST')
    expect(JSON.parse(String(resolutionCall?.[1]?.body))).toEqual({ revision: 7, customResolution: { type: 'DATE' } })
  })

  it('renders resolved and published conflicts read-only across unfamiliar payload shapes', async () => {
    const conflicts = [
      conflictFixture({ id: 'array', coordinate: 'Shape.array', alternatives: [{ type: 'STRING' }], evidence: [{ sourceId: 'source-array' }], resolved: true, customResolution: { type: 'STRING' }, resolvedAt: '2026-07-15T09:00:00Z' }),
      conflictFixture({ id: 'object', coordinate: 'Shape.object', alternatives: { first: { nested: true } }, evidence: { source: 'source-object' } }),
      conflictFixture({ id: 'scalar', coordinate: 'Shape.scalar', alternatives: 42, evidence: 'source-scalar' }),
      conflictFixture({ id: 'null', coordinate: 'Shape.null', alternatives: null, evidence: null }),
    ]
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, { ...draftFixture, status: 'PUBLISHED' })
      if (path.endsWith('/conflicts')) return jsonResponse(200, conflicts)
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Conflicts' }))

    expect(await screen.findAllByRole('article')).toHaveLength(4)
    expect(screen.queryByRole('button', { name: 'Review conflict' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resolve conflict' })).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'View details' })[0])
    expect(screen.getByText('Resolution')).toBeInTheDocument()
    expect(screen.getByText(/Custom value: type: STRING/)).toBeInTheDocument()
    await user.click(screen.getByText('Technical details'))
    expect(screen.getByText(/"alternatives"/)).toBeInTheDocument()
  })

  it('reviews candidates through progressive disclosure and navigates to the latest decision', async () => {
    const decision = { id: 'decision-4', sequence: 4, draftRevision: 7, type: 'PIN', reviewState: 'PINNED', candidateIdentity: candidateFixture.identity, priorValue: null, resultingValue: candidateFixture, rationale: 'Stable identifier', createdAt: '2026-07-15T08:02:00Z' }
    const fetchMock = stubFetch((url, init) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/candidates')) return jsonResponse(200, candidatePageFixture)
      if (path.endsWith('/decisions') && init?.method === 'POST') return jsonResponse(200, { ...decision, type: 'ACCEPT', reviewState: 'ACCEPTED' })
      if (path.endsWith('/decisions')) return jsonResponse(200, [decision])
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Candidates' }))

    const summaryTitle = await screen.findByText('Customer.customerId')
    expect(screen.queryByText('Evidence references')).not.toBeInTheDocument()
    expect(screen.queryByText(/sourceFingerprint/)).not.toBeInTheDocument()
    expect(screen.getByText('Supported by 4 independent sources')).toBeInTheDocument()
    await user.click(summaryTitle)
    expect(await screen.findByText('Evidence references')).toBeInTheDocument()
    expect(screen.queryByText(/sourceFingerprint/)).not.toBeInTheDocument()

    await user.click(screen.getByText('Technical details'))
    expect(await screen.findByText(/sourceFingerprint/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Optional rationale for Customer.customerId'), 'Looks correct')
    await user.click(screen.getByRole('button', { name: 'Accept' }))
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/decisions'), expect.objectContaining({ method: 'POST', body: expect.stringContaining('Looks correct') }))

    await user.click(screen.getByRole('button', { name: 'Show latest decision in history' }))
    const history = screen.getByRole('table', { name: 'Append-only decision history' })
    expect(history).toBeVisible()
    expect(document.getElementById('decision-decision-4')).toHaveFocus()
  })

  it('filters candidates with accessible composable controls, clears criteria, and resets defaults on remount', async () => {
    const values = [
      draftCandidate('node:Customer', { kind: 'NODE', label: 'Customer', property: null, propertyType: null, recommendationState: 'RECOMMENDED', effectiveReviewState: null, origins: ['OBSERVED'] }),
      draftCandidate('node-property:Customer:accountNumber', { label: 'Customer', property: 'accountNumber', originalProperty: 'account_no', recommendationState: 'LOW_SUPPORT', effectiveReviewState: 'PENDING', origins: ['GUIDED'] }),
      draftCandidate('node-key:Customer:customerId', { kind: 'NODE_KEY', label: 'Customer', property: null, propertyType: null, keys: ['customerId'], recommendationState: 'REVIEW_REQUIRED', effectiveReviewState: 'ACCEPTED', origins: ['INFERRED'] }),
      draftCandidate('relationship:Customer:OWNS:Account', { kind: 'RELATIONSHIP', label: null, property: null, propertyType: null, relationshipType: 'OWNS', fromLabel: 'Customer', toLabel: 'Account', recommendationState: 'SUPPRESSED', effectiveReviewState: 'REJECTED', origins: ['EXISTING'] }),
      draftCandidate('relationship-property:Customer:OWNS:Account:since', { kind: 'RELATIONSHIP_PROPERTY', label: null, property: 'since', propertyType: 'DATE', relationshipType: 'OWNS', fromLabel: 'Customer', toLabel: 'Account', recommendationState: 'RECOMMENDED', effectiveReviewState: 'MODIFIED', origins: ['GUIDED', 'EXISTING'] }),
    ]
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/candidates')) return jsonResponse(200, { page: 0, size: 50, totalElements: values.length, content: values })
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Candidates' }))

    const search = screen.getByRole('searchbox', { name: 'Search text' })
    const kind = screen.getByRole('combobox', { name: 'Candidate kind' })
    const recommendation = screen.getByRole('combobox', { name: 'Analyzer recommendation' })
    const reviewState = screen.getByRole('combobox', { name: 'Review state' })
    const origin = screen.getByRole('combobox', { name: 'Origin' })
    expect(search).toHaveValue('')
    expect(kind).toHaveValue('ALL')
    expect(recommendation).toHaveValue('ALL')
    expect(reviewState).toHaveValue('ALL')
    expect(origin).toHaveValue('ALL')
    expect(screen.getByText('Showing all 5 candidates')).toBeInTheDocument()

    await user.type(search, 'ACCOUNT_NO')
    expect(screen.getByText('Customer.accountNumber')).toBeInTheDocument()
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await user.selectOptions(kind, 'RELATIONSHIP_PROPERTY')
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await user.selectOptions(recommendation, 'SUPPRESSED')
    expect(screen.getByText('Customer —[OWNS]→ Account')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await user.selectOptions(reviewState, 'UNREVIEWED')
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await user.selectOptions(origin, 'EXISTING')
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(2)

    await user.selectOptions(kind, 'RELATIONSHIP_PROPERTY')
    expect(screen.getByText('1 matching candidate · 5 candidates total')).toBeInTheDocument()
    expect(screen.getByText('OWNS.since')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByText('Showing all 5 candidates')).toBeInTheDocument()

    await user.selectOptions(kind, 'NODE')
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    await user.click(screen.getByRole('tab', { name: 'Candidates' }))
    expect(screen.getByRole('searchbox', { name: 'Search text' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Candidate kind' })).toHaveValue('ALL')
    expect(screen.getByText('Showing all 5 candidates')).toBeInTheDocument()
  })

  it('filters before pagination, resets page boundaries, and removes stale rows for zero matches', async () => {
    const values = [
      ...Array.from({ length: 26 }, (_, index) => draftCandidate(`node:Match${index}`, {
        kind: 'NODE',
        label: `Match ${String(index).padStart(2, '0')}`,
        property: null,
        propertyType: null,
        origins: index < 2 ? ['GUIDED'] : ['OBSERVED'],
      })),
      ...Array.from({ length: 4 }, (_, index) => draftCandidate(`node:Other${index}`, {
        kind: 'NODE',
        label: `Other ${index}`,
        property: null,
        propertyType: null,
        origins: ['OBSERVED'],
      })),
    ]
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/candidates')) return jsonResponse(200, { page: 0, size: 50, totalElements: values.length, content: values })
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Candidates' }))

    await user.type(screen.getByRole('searchbox', { name: 'Search text' }), 'Match')
    expect(screen.getByText('26 matching candidates · 30 candidates total')).toBeInTheDocument()
    expect(screen.getByText('Page 1 · 26 items total')).toBeInTheDocument()
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(25)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Page 2 · 26 items total')).toBeInTheDocument()
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Origin' }), 'GUIDED')
    expect(screen.getByText('Page 1 · 2 items total')).toBeInTheDocument()
    expect(screen.getByText('2 matching candidates · 30 candidates total')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    const search = screen.getByRole('searchbox', { name: 'Search text' })
    await user.clear(search)
    await user.type(search, 'Nothing matches this')
    expect(screen.getByText('No matching candidates')).toBeInTheDocument()
    expect(screen.getByText(/adjust the candidate filters or clear them/i)).toBeInTheDocument()
    expect(document.querySelectorAll('.candidate-review-item')).toHaveLength(0)
    expect(screen.getByText('Page 1 · 0 items total')).toBeInTheDocument()
  })

  it('reports candidate contract errors without exposing decision actions', async () => {
    stubFetch((url) => {
      const path = new URL(url, 'http://test').pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/candidates')) return jsonResponse(200, { ...candidatePageFixture, content: [{ identity: 'broken' }] })
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Candidates' }))
    expect(await screen.findByText('Candidate contract error')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
  })

  it('organizes candidates across backend pages and clamps the UI page after a decision refresh', async () => {
    const makeCandidate = (identity: string, overrides: Partial<CandidateResponse>): CandidateResponse => ({
      ...candidateFixture,
      identity,
      evidence: [],
      effectiveReviewState: null,
      latestDecisionId: null,
      ...overrides,
    })
    const fillers = Array.from({ length: 24 }, (_, index) => makeCandidate(`node:Filler${index}`, {
      kind: 'NODE',
      label: `Filler ${String(index).padStart(2, '0')}`,
      property: null,
      propertyType: null,
      confidence: 0.99 - index * 0.01,
    }))
    const boundaryNode = makeCandidate('node:Boundary', { kind: 'NODE', label: 'Boundary', property: null, propertyType: null, confidence: 0.1 })
    const boundaryProperty = makeCandidate('node-property:Boundary:id', { kind: 'NODE_PROPERTY', label: 'Boundary', property: 'id', confidence: 0.95 })
    const relationship = makeCandidate('relationship:Boundary:LINKS:Target', {
      kind: 'RELATIONSHIP', label: null, property: null, propertyType: null, fromLabel: 'Boundary', relationshipType: 'LINKS', toLabel: 'Target', confidence: 0.99, recommendationState: 'RECOMMENDED',
    })
    const backendPages = [[relationship, boundaryProperty, ...fillers.slice(0, 23)], [fillers[23], boundaryNode]]
    let reduced = false
    const fetchMock = stubFetch((url, init) => {
      const parsed = new URL(url, 'http://test')
      const path = parsed.pathname
      if (path.endsWith('/schema-drafts/draft-1')) return jsonResponse(200, draftFixture)
      if (path.endsWith('/candidates')) {
        if (reduced) return jsonResponse(200, { page: 0, size: 25, totalElements: 1, content: [fillers[0]] })
        const page = Number(parsed.searchParams.get('page'))
        return jsonResponse(200, { page, size: 25, totalElements: 27, content: backendPages[page] })
      }
      if (path.endsWith('/decisions') && init?.method === 'POST') {
        reduced = true
        return jsonResponse(200, { id: 'decision-refresh', sequence: 1, draftRevision: 8, type: 'ACCEPT', reviewState: 'ACCEPTED', candidateIdentity: boundaryProperty.identity, priorValue: null, resultingValue: boundaryProperty, rationale: null, createdAt: '2026-07-15T10:00:00Z' })
      }
      if (path.endsWith('/decisions')) return jsonResponse(200, [])
      return jsonResponse(200, [])
    })
    const user = userEvent.setup()
    renderRoute('/schema-drafts/draft-1', 'kb-1')
    await user.click(await screen.findByRole('tab', { name: 'Candidates' }))

    expect(await screen.findByText('Boundary')).toBeInTheDocument()
    expect(screen.queryByText('Boundary.id')).not.toBeInTheDocument()
    expect(screen.queryByText('Boundary —[LINKS]→ Target')).not.toBeInTheDocument()
    expect(screen.getByText('Page 1 · 27 items total')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    const propertyTitle = await screen.findByText('Boundary.id')
    const relationshipTitle = screen.getByText('Boundary —[LINKS]→ Target')
    expect(screen.queryByText('Boundary')).not.toBeInTheDocument()
    expect(propertyTitle.compareDocumentPosition(relationshipTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('Page 2 · 27 items total')).toBeInTheDocument()

    await user.click(propertyTitle)
    await user.click(screen.getByRole('button', { name: 'Accept' }))

    expect(await screen.findByText('Page 1 · 1 items total')).toBeInTheDocument()
    expect(screen.getByText('Filler 00')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/decisions') && init?.method === 'POST')).toBe(true)
  })
})
