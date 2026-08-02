import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'
import { ChunkingPage } from './ChunkingPage'

const knowledgeBase = { id: 'kb-1', name: 'Migration KB', activeSchemaId: 'schema-1', createdAt: '2026-07-01T00:00:00Z' }
const documents = [
  { id: 'doc-1', knowledgeBaseId: 'kb-1', originalFilename: 'outdated.txt', contentType: 'text/plain', sizeBytes: 100, sha256: 'sha-1', contentUri: 'memory://doc-1', status: 'PROCESSED', uploadedAt: '2026-07-01T00:00:00Z', processedAt: '2026-07-01T00:01:00Z', errorMessage: null },
  { id: 'doc-2', knowledgeBaseId: 'kb-1', originalFilename: 'current.txt', contentType: 'text/plain', sizeBytes: 120, sha256: 'sha-2', contentUri: 'memory://doc-2', status: 'PROCESSED', uploadedAt: '2026-07-02T00:00:00Z', processedAt: '2026-07-02T00:01:00Z', errorMessage: null },
]
const processingOptions = { documentId: 'doc-1', parserId: 'text', fileFormat: 'txt', savedDefaults: null, savedDefaultsUpdatedAt: null, options: [{ key: 'chunkSize', valueType: 'INTEGER', defaultValue: 400, mutable: true, label: 'Chunk size', description: null, constraints: { min: 100, max: 1000 } }] }
const preview = {
  knowledgeBaseId: 'kb-1', selection: 'OUTDATED_STRATEGY', ready: true, blockers: [],
  target: { schemaId: 'schema-1', schemaContentHash: 'schema-sha', aiProfileId: 'profile-1', aiProfileRevision: 4, embeddingSpaceId: 'embedding-1', expectedChunkerRevision: 'chunker-v2' },
  classificationCounts: { noChunks: 1, outdated: 1, current: 1 }, selectedCount: 2,
  selectedDocuments: { page: 0, size: 10, totalElements: 2, content: [
    { id: 'doc-1', originalFilename: 'outdated.txt', sha256: 'sha-1', uploadedAt: '2026-07-01T00:00:00Z', classification: 'OUTDATED', effectiveChunkerRevision: 'chunker-v1', parserRevision: 'parser-v1' },
    { id: 'doc-2', originalFilename: 'current.txt', sha256: 'sha-2', uploadedAt: '2026-07-02T00:00:00Z', classification: 'CURRENT', effectiveChunkerRevision: 'chunker-v2', parserRevision: 'parser-v1' },
  ] },
}
const plan = {
  id: 'plan-1', reason: 'CHUNK_STRATEGY_MIGRATION', selection: 'OUTDATED_STRATEGY', expectedChunkerRevision: 'chunker-v2', status: 'PARTIAL', draftId: null, knowledgeBaseId: 'kb-1', schemaId: 'schema-1', schemaContentHash: 'schema-sha', aiProfileId: 'profile-1', aiProfileRevision: 4, retryOfPlanId: null,
  totalDocuments: 2, queuedDocuments: 0, runningDocuments: 0, succeededDocuments: 1, failedDocuments: 0, staleDocuments: 1, blockedDocuments: 0, createdAt: '2026-07-03T00:00:00Z', startedAt: '2026-07-03T00:00:01Z', completedAt: '2026-07-03T00:02:00Z',
  items: { page: 0, size: 10, totalElements: 2, content: [
    { id: 'item-1', documentId: 'doc-1', documentSha256: 'sha-1', status: 'STALE_SOURCE', failureCategory: 'SOURCE_CHANGED', retryable: true, priorItemId: null, startedAt: null, completedAt: null },
    { id: 'item-2', documentId: 'doc-2', documentSha256: 'sha-2', status: 'SUCCEEDED', failureCategory: null, retryable: false, priorItemId: null, startedAt: null, completedAt: '2026-07-03T00:02:00Z' },
  ] },
}
const history = { page: 0, size: 10, totalElements: 1, content: [{ ...plan, latest: true, targetCurrent: true, retryable: true, statusLocation: '/reprocessing-plans/plan-1' }] }

function setup(options: { createStatus?: number; missingPlan?: boolean; previewOverride?: Record<string, unknown> } = {}) {
  const createBodies: unknown[] = []
  const retryBodies: unknown[] = []
  const previewBodies: unknown[] = []
  let previewCalls = 0
  const fetchMock = stubFetch((url, init) => {
    if (url.endsWith('/knowledge-bases')) return jsonResponse(200, [knowledgeBase])
    if (url.endsWith('/documents')) return jsonResponse(200, documents)
    if (url.includes('/processing-options')) return jsonResponse(200, processingOptions)
    if (url.includes('/chunk-migrations/preview')) {
      previewCalls += 1
      const body = init?.body ? JSON.parse(String(init.body)) as { selection: string } : { selection: 'OUTDATED_STRATEGY' }
      previewBodies.push(body)
      return jsonResponse(200, { ...preview, ...options.previewOverride, selection: body.selection })
    }
    if (url.endsWith('/retry')) {
      retryBodies.push(JSON.parse(String(init?.body)))
      return jsonResponse(202, { planId: 'retry-plan', status: 'QUEUED', statusLocation: '/reprocessing-plans/retry-plan' })
    }
    if (url.includes('/reprocessing-plans/')) {
      return options.missingPlan ? jsonResponse(404, { status: 404, detail: 'Plan not found' }) : jsonResponse(200, plan)
    }
    if (url.endsWith('/reprocessing-plans') && init?.method === 'POST') {
      createBodies.push(JSON.parse(String(init.body)))
      return options.createStatus === 409 ? jsonResponse(409, { status: 409, detail: 'Target changed' }) : jsonResponse(202, { planId: 'plan-1', status: 'QUEUED', statusLocation: '/reprocessing-plans/plan-1' })
    }
    if (url.includes('/reprocessing-plans?')) return jsonResponse(200, history)
    return jsonResponse(404, { status: 404, detail: `Unexpected request: ${url}` })
  })
  return { fetchMock, createBodies, retryBodies, previewBodies, getPreviewCalls: () => previewCalls }
}

afterEach(() => vi.unstubAllGlobals())

describe('ChunkMigrationWorkflow', () => {
  it('previews the default outdated scope and creates only from the matching target', async () => {
    const { fetchMock, createBodies } = setup()
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    expect(await screen.findByText('Migration preview ready')).toBeInTheDocument()
    expect(screen.getByText(/schema-1 · schema-sha/)).toBeInTheDocument()
    expect(screen.getByText('profile-1 · revision 4')).toBeInTheDocument()
    expect(screen.getAllByText('chunker-v2').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Create migration plan' }))

    await waitFor(() => expect(createBodies).toEqual([{
      reason: 'CHUNK_STRATEGY_MIGRATION', selection: 'OUTDATED_STRATEGY', processingOptions: null, expectedChunkerRevision: 'chunker-v2',
    }]))
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/chunk-migrations/preview'))).toBe(true)
  })

  it('keeps forced-all creation behind an accessible confirmation and omits document ids', async () => {
    const { createBodies } = setup()
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    await user.click(await screen.findByText('Advanced scopes'))
    await user.click(screen.getByRole('radio', { name: /All documents/ }))
    await user.click(await screen.findByRole('button', { name: 'Review forced-all creation' }))
    const dialog = screen.getByRole('dialog', { name: 'Confirm forced-all migration' })
    expect(within(dialog).getByText(/current documents as well as documents with missing or outdated chunks/i)).toBeInTheDocument()
    expect(createBodies).toHaveLength(0)
    await user.click(within(dialog).getByRole('button', { name: 'Confirm and create migration' }))

    await waitFor(() => expect(createBodies).toEqual([{
      reason: 'CHUNK_STRATEGY_MIGRATION', selection: 'ALL', processingOptions: null, expectedChunkerRevision: 'chunker-v2',
    }]))
  })

  it('validates selected ids against the selected knowledge base and invalidates preview inputs', async () => {
    const { getPreviewCalls } = setup()
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    await user.click(await screen.findByText('Advanced scopes'))
    await user.click(screen.getByRole('radio', { name: /Selected documents/ }))
    const selectedIds = await screen.findByLabelText('Selected document IDs')
    fireEvent.change(selectedIds, { target: { value: 'other-kb-document' } })
    expect(await screen.findByText('Selected document IDs are not owned by this knowledge base')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create migration plan' })).toBeDisabled()
    const before = getPreviewCalls()
    fireEvent.change(selectedIds, { target: { value: 'doc-1' } })
    await waitFor(() => expect(getPreviewCalls()).toBeGreaterThan(before))
  })

  it('reuses document processing-option definitions in the preview and create payload', async () => {
    const { previewBodies, createBodies } = setup()
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    await user.click(await screen.findByRole('checkbox', { name: 'Override document processing options' }))
    const option = await screen.findByLabelText('Value for Chunk size')
    await user.clear(option)
    await user.type(option, '500')
    await waitFor(() => expect(previewBodies.at(-1)).toMatchObject({ processingOptions: { chunkSize: 500 } }))
    await user.click(await screen.findByRole('button', { name: 'Create migration plan' }))
    await waitFor(() => expect(createBodies[0]).toMatchObject({ processingOptions: { chunkSize: 500 } }))
  })

  it('renders backend blockers and keeps plan creation disabled', async () => {
    const { createBodies } = setup({ previewOverride: { ready: false, blockers: [{ code: 'ACTIVE_DESTRUCTIVE_PLAN', message: 'An active destructive plan is already running.' }] } })
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    expect(await screen.findByText('Another destructive plan is active · ACTIVE_DESTRUCTIVE_PLAN')).toBeInTheDocument()
    expect(screen.getByText('An active destructive plan is already running.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create migration plan' })).toBeDisabled()
    expect(createBodies).toHaveLength(0)
  })

  it('preserves the scope draft and requires a fresh preview after admission conflict', async () => {
    const { createBodies } = setup({ createStatus: 409 })
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    await user.click(await screen.findByRole('button', { name: 'Create migration plan' }))
    expect(await screen.findByText('Fresh preview required')).toBeInTheDocument()
    expect(createBodies).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Create migration plan' })).toBeEnabled()
  })

  it('loads deep-linked plans, explains stale sources, and sends only the closed retry mode', async () => {
    const { retryBodies } = setup()
    const user = userEvent.setup()
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing&planId=plan-1']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    expect(await screen.findByText(/Stale source · doc-1/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry unresolved work' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry unresolved work' }))
    const dialog = screen.getByRole('dialog', { name: 'Retry unresolved migration work' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirm retry' }))
    await waitFor(() => expect(retryBodies).toEqual([{ mode: 'RESNAPSHOT_UNRESOLVED' }]))
  })

  it('clears a not-owned deep link without changing the selected knowledge base', async () => {
    setup({ missingPlan: true })
    renderWithProviders(<MemoryRouter initialEntries={['/chunking?view=reprocessing&planId=missing']}><ChunkingPage /></MemoryRouter>, { selectedKnowledgeBaseId: 'kb-1' })

    expect(await screen.findByText('Migration context cleared')).toBeInTheDocument()
    expect(screen.getByText(/not owned by the selected knowledge base/i)).toBeInTheDocument()
    expect(screen.getByText('Scope: Migration KB')).toBeInTheDocument()
  })
})
