import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SchemaDraftsPage } from './SchemaDraftsPage'
import { analysisDetailFixture, analysisHistoryFixture, candidatePageFixture, draftFixture } from './schemaDraftFixtures'
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
    const candidateIdentities = await screen.findAllByText(candidatePageFixture.content[0].identity)
    await user.click(candidateIdentities[0])
    expect(await screen.findByText('Recommendation: RECOMMENDED')).toBeInTheDocument()
    expect(screen.getByText('Review: PINNED')).toBeInTheDocument()

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
})
