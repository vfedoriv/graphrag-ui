import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemaDraftReleaseWorkflow } from './SchemaDraftReleaseWorkflow'
import {
  analysisRequiredEligibilityFixture, draftFixture, eligibilityFixture, evaluationFixture, evaluationHistoryFixture, planFixture,
  planHistoryFixture, publicationFixture, readinessFixture,
} from './schemaDraftFixtures'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

afterEach(() => vi.restoreAllMocks())

const document = { id: 'document-1', knowledgeBaseId: 'kb-1', originalFilename: 'document.txt', contentType: 'text/plain', sizeBytes: 100, sha256: 'sha', contentUri: 'memory://document-1', status: 'PROCESSED', uploadedAt: '2026-07-15T08:00:00Z', processedAt: '2026-07-15T08:01:00Z', errorMessage: null }
const options = { documentId: 'document-1', parserId: 'text', fileFormat: 'txt', savedDefaults: null, savedDefaultsUpdatedAt: null, options: [{ key: 'chunkSize', valueType: 'INTEGER', defaultValue: 400, mutable: true, label: 'Chunk size', description: null, constraints: { min: 100, max: 1000 } }] }

function setup(activeSchemaId: string | null, published = false, draftOverride = draftFixture, overrides: { drifted?: boolean; stalePublish?: boolean; eligibility?: typeof eligibilityFixture } = {}) {
  const fetchMock = stubFetch((url, init) => {
    if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [{ id: 'kb-1', name: 'KB', activeSchemaId, createdAt: '2026-07-15T08:00:00Z' }])
    if (url.endsWith('/documents')) return jsonResponse(200, [document])
    if (url.includes('/processing-options')) return jsonResponse(200, options)
    if (url.includes('/evaluation-eligible-documents')) return jsonResponse(200, overrides.eligibility ?? eligibilityFixture)
    if (url.includes('/evaluation-runs/evaluation-partial')) return jsonResponse(200, evaluationFixture)
    if (url.includes('/evaluation-runs')) {
      if (init?.method === 'POST') return jsonResponse(202, { runId: 'evaluation-partial', status: 'QUEUED', statusLocation: '/evaluation-runs/evaluation-partial' })
      return jsonResponse(200, evaluationHistoryFixture)
    }
    if (url.endsWith('/publication-readiness')) return jsonResponse(200, readinessFixture)
    if (url.endsWith('/publication')) return jsonResponse(200, { ...publicationFixture, active: activeSchemaId === 'schema-2', contentDrifted: overrides.drifted ?? false, currentSchemaContentHash: overrides.drifted ? 'edited-sha' : publicationFixture.currentSchemaContentHash })
    if (url.endsWith('/publish')) return overrides.stalePublish ? jsonResponse(409, { title: 'Conflict', detail: 'Projection content hash changed', status: 409 }) : jsonResponse(200, publicationFixture)
    if (url.endsWith('/schemas/schema-2/activate')) return jsonResponse(204, null)
    if (url.includes('/reprocessing-plans/plan-partial')) return jsonResponse(200, planFixture)
    if (url.includes('/reprocessing-plans')) {
      if (init?.method === 'POST') return jsonResponse(202, { planId: 'plan-partial', status: 'QUEUED', statusLocation: '/reprocessing-plans/plan-partial' })
      return jsonResponse(200, planHistoryFixture)
    }
    return jsonResponse(404, { title: 'Not found', status: 404 })
  })
  const draft = published ? { ...draftOverride, status: 'PUBLISHED' as const, publicationSchemaId: 'schema-2', publicationContentHash: 'projection-sha', currentPublishedSchemaContentHash: 'projection-sha' } : draftOverride
  renderWithProviders(<MemoryRouter><SchemaDraftReleaseWorkflow draft={draft} /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })
  return fetchMock
}

describe('SchemaDraftReleaseWorkflow', () => {
  it('uses backend eligibility, disables discovery evidence, and starts an advisory evaluation with the snapshot revision', async () => {
    const user = userEvent.setup()
    const fetchMock = setup(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const eligible = await screen.findByRole('checkbox', { name: 'Select held-out.txt' })
    expect(screen.getByRole('link', { name: 'Open Documents' })).toHaveAttribute('href', '/documents')
    expect(screen.getByText(/upload and process a normal document.*do not add it as a draft source.*return to Release/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select discovery.txt' })).toBeDisabled()
    expect(screen.getByText('Contributed active discovery evidence.')).toBeInTheDocument()
    await user.click(eligible)
    const advisory = screen.getByRole('checkbox', { name: 'Include advisory model assessment' })
    expect(advisory).not.toBeChecked()
    expect(advisory.parentElement).toHaveClass('choice-label')
    await user.click(advisory)
    expect(advisory).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Start held-out evaluation' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/evaluation-runs') && init?.method === 'POST' && init.body === JSON.stringify({ revision: 7, documentIds: ['held-out-1'], advisoryEnabled: true }))).toBe(true))
  })

  it('blocks an analysis-required eligibility page with accurate page and row explanations', async () => {
    setup(null, false, draftFixture, { eligibility: analysisRequiredEligibilityFixture })

    expect(await screen.findByText('Held-out evaluation not ready')).toBeInTheDocument()
    expect(screen.getAllByText('Current draft analysis is required before held-out evaluation.')).toHaveLength(3)
    expect(screen.getByRole('checkbox', { name: 'Select held-out.txt' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Select discovery.txt' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Start held-out evaluation' })).toBeDisabled()
  })

  it('keeps ineligible rows and disabled evaluation controls while explaining the current page handoff', async () => {
    setup(null, false, draftFixture, {
      eligibility: { ...eligibilityFixture, content: eligibilityFixture.content.filter((item) => !item.eligible), size: 10, totalElements: 11 },
    })

    expect(await screen.findByText('No eligible held-out documents on this page')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Documents' })).toHaveAttribute('href', '/documents')
    expect(screen.getByRole('checkbox', { name: 'Select discovery.txt' })).toBeDisabled()
    expect(screen.getByText('Contributed active discovery evidence.')).toBeInTheDocument()
    const eligibilityPager = screen.getByText('Page 1 · 11 items total').parentElement!
    expect(within(eligibilityPager).getByRole('button', { name: 'Next' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Start held-out evaluation' })).toBeDisabled()
  })

  it('keeps deterministic and advisory results separate and renders not-applicable and reused outcomes', async () => {
    const draft = { ...draftFixture, latestEvaluation: { id: 'evaluation-partial', status: 'PARTIAL', current: true, latest: true, statusLocation: '/evaluation-runs/evaluation-partial' } }
    setup(null, false, draft)
    expect(await screen.findByRole('heading', { name: 'Deterministic metrics' })).toBeInTheDocument()
    expect(screen.getByText('Not applicable')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Advisory model assessment' })).toBeInTheDocument()
    expect(screen.getByText('Reused prior success')).toBeInTheDocument()
  })

  it('publishes exact readiness authority and keeps activation separate', async () => {
    const user = userEvent.setup()
    const fetchMock = setup(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(await screen.findByRole('button', { name: 'Publish inactive schema' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/publish') && init?.body === JSON.stringify({ revision: 7, projectionContentHash: 'projection-sha' }))).toBe(true))
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/activate'))).toBe(false)
  })

  it('activates a published schema only after separate confirmation', async () => {
    const user = userEvent.setup()
    const fetchMock = setup('schema-old', true)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(await screen.findByRole('button', { name: 'Activate published schema' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/schemas/schema-2/activate') && init?.method === 'POST')).toBe(true))
    expect(screen.getByText(/Publication did not activate it/)).toBeInTheDocument()
  })

  it('creates an explicit-document plan with normalized processing options', async () => {
    const user = userEvent.setup()
    const fetchMock = setup('schema-2', true)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(await screen.findByRole('radio', { name: 'Explicit documents' }))
    await user.click(screen.getByRole('checkbox', { name: /document.txt/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Override processing options' }))
    await user.clear(await screen.findByLabelText('Value for Chunk size'))
    await user.type(screen.getByLabelText('Value for Chunk size'), '500')
    await user.click(screen.getByRole('button', { name: 'Create reprocessing plan' }))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith('/reprocessing-plans') && init?.body === JSON.stringify({ draftId: 'draft-1', schemaId: 'schema-2', allDocuments: false, documentIds: ['document-1'], processingOptions: { chunkSize: 500 } }))).toBe(true))
  })

  it('blocks stale eligibility and requires an explicit refresh', async () => {
    setup(null, false, { ...draftFixture, revision: 8 })
    expect(await screen.findByText('Eligibility snapshot is stale')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start held-out evaluation' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Refresh eligibility' })).toBeInTheDocument()
  })

  it('gates evaluation and readiness until analysis produces a current aggregate', async () => {
    setup(null, false, { ...draftFixture, currentAggregateId: null })
    expect(await screen.findByText('Current analysis required')).toBeInTheDocument()
    expect(screen.getByText('Publication readiness unavailable')).toBeInTheDocument()
    expect(await screen.findByRole('checkbox', { name: 'Select held-out.txt' })).toBeDisabled()
  })

  it('does not retry a stale publication token automatically', async () => {
    const user = userEvent.setup()
    const fetchMock = setup(null, false, draftFixture, { stalePublish: true })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(await screen.findByRole('button', { name: 'Publish inactive schema' }))
    expect(await screen.findByText('Projection content hash changed')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/publish'))).toHaveLength(1)
  })

  it('shows publication drift and restores partial-plan safety outcomes and retry controls after reload', async () => {
    const draft = { ...draftFixture, latestReprocessing: { id: 'plan-partial', status: 'PARTIAL', targetCurrent: true, latest: true, statusLocation: '/reprocessing-plans/plan-partial' } }
    setup('schema-2', true, draft, { drifted: true })
    expect(await screen.findByText('Published schema has drifted')).toBeInTheDocument()
    expect(await screen.findByText('Blocked: document-3')).toBeInTheDocument()
    expect(screen.getByText('Changed document: document-2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry unresolved work' })).toBeInTheDocument()
  })

  it('identifies item totals in every release workbench pager', async () => {
    const draft = {
      ...draftFixture,
      latestEvaluation: { id: 'evaluation-partial', status: 'PARTIAL', current: true, latest: true, statusLocation: '/evaluation-runs/evaluation-partial' },
      latestReprocessing: { id: 'plan-partial', status: 'PARTIAL', targetCurrent: true, latest: true, statusLocation: '/reprocessing-plans/plan-partial' },
    }
    setup('schema-2', true, draft)

    expect(await screen.findByText('Reused prior success')).toBeInTheDocument()
    expect(await screen.findByText('Blocked: document-3')).toBeInTheDocument()
    expect(screen.getAllByText('Page 1 · 2 items total')).toHaveLength(3)
    expect(screen.getAllByText('Page 1 · 3 items total')).toHaveLength(2)
  })
})
