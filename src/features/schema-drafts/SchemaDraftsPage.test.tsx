import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SchemaDraftsPage } from './SchemaDraftsPage'
import { analysisDetailFixture, analysisHistoryFixture, candidateFixture, candidatePageFixture, draftFixture } from './schemaDraftFixtures'
import type { CandidateResponse } from './schemaDraftTypes'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

afterEach(() => vi.restoreAllMocks())

function renderRoute(path: string, selectedKnowledgeBaseId: string | null) {
  return renderWithProviders(<MemoryRouter initialEntries={[path]}><Routes><Route path='/schema-drafts' element={<SchemaDraftsPage />} /><Route path='/schema-drafts/:draftId' element={<SchemaDraftsPage />} /></Routes></MemoryRouter>, { selectedKnowledgeBaseId })
}

describe('SchemaDraftsPage', () => {
  it('does not request drafts without a selected knowledge base', () => {
    const fetchMock = stubFetch(() => jsonResponse(500, {}))
    renderRoute('/schema-drafts', null)
    expect(screen.getByText('No knowledge base selected')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
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
    const conflict = { id: 'conflict-1', type: 'PROPERTY_TYPE', coordinate: 'Customer.age', alternatives: ['STRING', 'INTEGER'], evidence: [], resolved: false, selectedAlternative: null, customResolution: null, createdAt: '2026-07-15T08:03:00Z', resolvedAt: null }
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
      if (path.endsWith('/diff')) return jsonResponse(200, { aggregateRevisionId: 'aggregate-1', changes: [{ coordinate: 'Customer.age', compatibility: 'BREAKING', operation: 'CHANGE_TYPE', before: 'STRING', after: 'INTEGER' }] })
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
    await user.click(screen.getByRole('button', { name: 'Structured JSON' }))
    expect(screen.getByText(/"nodes"/)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Diff' }))
    expect((await screen.findAllByText(/CHANGE_TYPE/)).length).toBeGreaterThan(0)
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
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
