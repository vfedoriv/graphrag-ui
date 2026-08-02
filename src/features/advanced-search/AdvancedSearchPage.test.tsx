import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvancedSearchPage } from './AdvancedSearchPage'
import { AdvancedSearchResultFetchError } from './AdvancedSearchResultFetchError'
import { ApiError } from '../../api/types'
import { renderWithProviders, jsonResponse, stubFetch } from '../../test/helpers'

const knowledgeBases = [{ id: 'kb-1', name: 'Research', activeSchemaId: 'schema-1', createdAt: '2026-08-01T00:00:00Z' }]

function runDetail(id: string, query: string, status: 'QUEUED' | 'RUNNING' | 'COMPLETED' = 'QUEUED') {
  return {
    id,
    knowledgeBaseId: 'kb-1',
    query,
    maximumEvidence: 5,
    includeEvidenceText: true,
    status,
    stage: status === 'COMPLETED' ? 'TERMINAL' : 'QUEUED',
    completedBranches: status === 'COMPLETED' ? 1 : 0,
    totalBranches: 1,
    evidenceCount: status === 'COMPLETED' ? 1 : 0,
    cancellationRequested: false,
    failureCategory: null,
    deadlineAt: '2026-08-02T01:00:00Z',
    createdAt: '2026-08-02T00:00:00Z',
    startedAt: null,
    completedAt: status === 'COMPLETED' ? '2026-08-02T00:01:00Z' : null,
    links: {},
  }
}

function summary(run: ReturnType<typeof runDetail>) {
  const { query, ...rest } = run
  return { ...rest, queryPreview: query }
}

function mockAdvancedSearchApi(options: {
  readiness?: Record<string, unknown>
  createStatus?: 201 | 429 | 409
  onCreate?: (payload: Record<string, unknown>) => unknown
} = {}) {
  const runs = [runDetail('run-old', 'Earlier question', 'COMPLETED')]
  const requests: Array<{ url: string; init?: RequestInit }> = []
  let createCount = 0
  const fetchMock = stubFetch((url, init) => {
    requests.push({ url, init })
    const parsed = new URL(url, 'http://test')
    const path = parsed.pathname.replace('/api/v1', '')

    if (path === '/knowledge-bases') return jsonResponse(200, knowledgeBases)
    if (path === '/runtime-settings') return jsonResponse(200, [])
    if (path.endsWith('/readiness')) {
      return jsonResponse(200, options.readiness ?? {
        knowledgeBaseId: 'kb-1', ready: true, profileId: 'profile-1', profileRevision: 2,
        graphBranchAvailable: true, embeddedCorpusPresent: true, blockers: [], informational: [],
      })
    }
    if (path.endsWith('/advanced-search-runs') && init?.method === 'POST') {
      const payload = JSON.parse(String(init.body)) as Record<string, unknown>
      if (options.createStatus === 429) return jsonResponse(429, { title: 'Queue full', detail: 'Queue is full' })
      if (options.createStatus === 409) return jsonResponse(409, { title: 'Readiness changed', detail: 'Schema changed', blockers: [{ code: 'SCHEMA_CHANGED', description: 'Refresh schema' }] })
      createCount += 1
      const created = runDetail(`run-${createCount}`, String(payload.query), 'RUNNING')
      runs.unshift(created)
      options.onCreate?.(payload)
      return jsonResponse(201, created)
    }
    if (path.endsWith('/advanced-search-runs') && init?.method !== 'POST') {
      const status = parsed.searchParams.get('status')
      const content = runs.filter((run) => !status || run.status === status).map(summary)
      return jsonResponse(200, { page: Number(parsed.searchParams.get('page') ?? 0), size: 10, totalElements: content.length, content })
    }
    const detailMatch = path.match(/advanced-search-runs\/(run-[^/]+)$/)
    if (detailMatch) {
      const run = runs.find((item) => item.id === detailMatch[1])
      return run ? jsonResponse(200, run) : jsonResponse(404, { title: 'Not found' })
    }
    return jsonResponse(200, {})
  })
  return { fetchMock, requests, runs }
}

function renderPage(selectedKnowledgeBaseId: string | null = 'kb-1') {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/advanced-search']}>
      <AdvancedSearchPage />
    </MemoryRouter>,
    { selectedKnowledgeBaseId },
  )
}

describe('AdvancedSearchPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows readiness blockers and informational degraded capabilities separately', async () => {
    mockAdvancedSearchApi({
      readiness: {
        knowledgeBaseId: 'kb-1', ready: false, profileId: null, profileRevision: 0,
        graphBranchAvailable: false, embeddedCorpusPresent: false,
        blockers: [{ code: 'AI_PROFILE_MISSING', description: 'Assign an AI profile' }],
        informational: [
          { code: 'SCHEMA_UNAVAILABLE', description: 'No active schema' },
          { code: 'EMPTY_CORPUS', description: 'No embedded chunks' },
        ],
      },
    })
    renderPage()

    expect(await screen.findByText('Submission blockers')).toBeInTheDocument()
    expect(screen.getByText(/AI_PROFILE_MISSING/)).toBeInTheDocument()
    expect(screen.getByText(/Text-only search available/)).toBeInTheDocument()
    expect(screen.getByText(/Embedded corpus is empty/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled()
  })

  it('omits blank maximum evidence, defaults evidence text on, and focuses accepted runs', async () => {
    const { requests } = mockAdvancedSearchApi()
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Question'), 'Which accounts are active?')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))

    expect(await screen.findByRole('heading', { name: 'run-1' })).toBeInTheDocument()
    const createRequest = requests.find(({ url, init }) => url.endsWith('/advanced-search-runs') && init?.method === 'POST')
    expect(createRequest).toBeDefined()
    const payload = JSON.parse(String(createRequest?.init?.body))
    expect(payload).toEqual({ query: 'Which accounts are active?', includeEvidenceText: true })
    expect(await screen.findByText('Search run accepted')).toBeInTheDocument()
    expect(screen.getAllByText('Which accounts are active?').length).toBeGreaterThan(1)
  })

  it('allows concurrent submissions and preserves queue-full drafts', async () => {
    const first = mockAdvancedSearchApi()
    const user = userEvent.setup()
    renderPage()

    const question = await screen.findByLabelText('Question')
    await user.type(question, 'First question')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    expect(await screen.findByRole('heading', { name: 'run-1' })).toBeInTheDocument()

    await user.clear(question)
    await user.type(question, 'Second question')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    expect(await screen.findByRole('heading', { name: 'run-2' })).toBeInTheDocument()
    expect(first.requests.some(({ init }) => init?.method === 'POST' && String(init.body).includes('cancel'))).toBe(false)

    vi.unstubAllGlobals()
    mockAdvancedSearchApi({ createStatus: 429 })
    await user.clear(question)
    await user.type(question, 'Keep this draft')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    expect(await screen.findByText('Search queue is full')).toBeInTheDocument()
    expect(question).toHaveValue('Keep this draft')
  })

  it('sends explicit maximum evidence and preserves result eligibility only for terminal result statuses', async () => {
    const { requests } = mockAdvancedSearchApi()
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Advanced options' }))
    await user.type(screen.getByLabelText('Maximum evidence'), '12')
    await user.type(screen.getByLabelText('Question'), 'Find evidence')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    expect(await screen.findByRole('heading', { name: 'run-1' })).toBeInTheDocument()

    const createRequest = requests.find(({ url, init }) => url.endsWith('/advanced-search-runs') && init?.method === 'POST')
    expect(JSON.parse(String(createRequest?.init?.body))).toMatchObject({ maximumEvidence: 12, includeEvidenceText: true })
    expect(screen.queryByText('Result handoff eligible')).not.toBeInTheDocument()
  })

  it('preserves focused context for pre-result, expired, and transport failures', () => {
    const { rerender } = render(<AdvancedSearchResultFetchError error={new ApiError({ status: 409, message: 'Not ready' })} />)
    expect(screen.getByText('Result is not ready yet')).toBeInTheDocument()
    rerender(<AdvancedSearchResultFetchError error={new ApiError({ status: 404, message: 'Expired' })} />)
    expect(screen.getByText('Result expired or unavailable')).toBeInTheDocument()
    rerender(<AdvancedSearchResultFetchError error={new ApiError({ status: 0, message: 'Network request failed' })} />)
    expect(screen.getByText('Result request failed')).toBeInTheDocument()
    expect(screen.getByText(/Network request failed/)).toBeInTheDocument()
  })
})
