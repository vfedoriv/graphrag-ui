import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SchemaDraftsPage } from './SchemaDraftsPage'
import { analysisDetailFixture, analysisHistoryFixture, candidateFixture, candidatePageFixture, draftFixture } from './schemaDraftFixtures'
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

    await user.click(screen.getByRole('tab', { name: 'Candidates' }))
    await user.click(await screen.findByText('Customer.customerId'))
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
})
