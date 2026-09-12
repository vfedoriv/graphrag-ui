import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvancedSearchPage } from './AdvancedSearchPage'
import { AdvancedSearchResultFetchError } from './AdvancedSearchResultFetchError'
import type { AdvancedSearchRunStatus } from '../../api/types'
import { ApiError } from '../../api/types'
import { queryKeys } from '../../api/queryKeys'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { renderWithProviders, jsonResponse, stubFetch } from '../../test/helpers'

const knowledgeBases = [{ id: 'kb-1', name: 'Research', activeSchemaId: 'schema-1', createdAt: '2026-08-01T00:00:00Z' }]

function runDetail(id: string, query: string, status: AdvancedSearchRunStatus = 'QUEUED') {
  const terminal = !['QUEUED', 'RUNNING'].includes(status)
  return {
    id,
    knowledgeBaseId: 'kb-1',
    query,
    maximumEvidence: 5,
    includeEvidenceText: true,
    status,
    stage: terminal ? 'TERMINAL' : status,
    completedBranches: status === 'COMPLETED' ? 1 : 0,
    totalBranches: 1,
    evidenceCount: status === 'COMPLETED' ? 1 : 0,
    cancellationRequested: false,
    failureCategory: null,
    deadlineAt: '2026-08-02T01:00:00Z',
    createdAt: '2026-08-02T00:00:00Z',
    startedAt: null,
    completedAt: terminal ? '2026-08-02T00:01:00Z' : null,
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
  onSubmit?: () => ReturnType<typeof jsonResponse> | Promise<ReturnType<typeof jsonResponse>>
  onCancel?: () => ReturnType<typeof jsonResponse> | Promise<ReturnType<typeof jsonResponse>>
  onCreate?: (payload: Record<string, unknown>) => unknown
  initialRuns?: ReturnType<typeof runDetail>[]
  onDetail?: (runId: string) => ReturnType<typeof jsonResponse> | undefined
} = {}) {
  const runs = options.initialRuns ?? [runDetail('run-old', 'Earlier question', 'COMPLETED')]
  const requests: Array<{ url: string; init?: RequestInit }> = []
  let createCount = 0
  const fetchMock = stubFetch((url, init) => {
    requests.push({ url, init })
    const parsed = new URL(url, 'http://test')
    const path = parsed.pathname.replace('/api/v1', '')
    const knowledgeBaseId = path.match(/^\/knowledge-bases\/([^/]+)/)?.[1]

    if (path === '/knowledge-bases') return jsonResponse(200, knowledgeBases)
    if (path === '/runtime-settings') return jsonResponse(200, [])
    if (path.endsWith('/readiness')) {
      return jsonResponse(200, options.readiness ?? {
        knowledgeBaseId, ready: true, profileId: 'profile-1', profileRevision: 2,
        graphBranchAvailable: true, embeddedCorpusPresent: true, blockers: [], informational: [],
      })
    }
    if (path.endsWith('/advanced-search-runs') && init?.method === 'POST') {
      const payload = JSON.parse(String(init.body)) as Record<string, unknown>
      if (options.onSubmit) return options.onSubmit()
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
      const matching = runs.filter((run) => run.knowledgeBaseId === knowledgeBaseId && (!status || run.status === status))
      const page = Number(parsed.searchParams.get('page') ?? 0)
      return jsonResponse(200, { page, size: 10, totalElements: matching.length, content: matching.slice(page * 10, (page + 1) * 10).map(summary) })
    }
    const cancelMatch = path.match(/advanced-search-runs\/(run-[^/]+)\/cancel$/)
    if (cancelMatch && init?.method === 'POST') {
      if (options.onCancel) return options.onCancel()
      const run = runs.find((item) => item.id === cancelMatch[1] && item.knowledgeBaseId === knowledgeBaseId)
      if (run) {
        run.cancellationRequested = true
        return jsonResponse(200, run)
      }
    }
    const detailMatch = path.match(/advanced-search-runs\/(run-[^/]+)$/)
    if (detailMatch) {
      const response = options.onDetail?.(detailMatch[1])
      if (response) return response
      const run = runs.find((item) => item.id === detailMatch[1] && item.knowledgeBaseId === knowledgeBaseId)
      return run ? jsonResponse(200, run) : jsonResponse(404, { title: 'Not found' })
    }
    return jsonResponse(200, {})
  })
  return { fetchMock, requests, runs }
}

function WorkspaceControls() {
  const { setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const location = useLocation()
  return (
    <>
      <button onClick={() => setSelectedKnowledgeBaseId('kb-2')}>Switch workspace</button>
      <button onClick={() => setSelectedKnowledgeBaseId(null)}>Clear workspace</button>
      <output aria-label='Current URL'>{location.pathname}{location.search}</output>
    </>
  )
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

  it.each(['Switch workspace', 'Clear workspace'])('resets focused run context on %s', async (action) => {
    const oldRuns = Array.from({ length: 11 }, (_, index) => runDetail(`run-old-${index}`, `Old question ${index}`, 'RUNNING'))
    const newRun = { ...runDetail('run-new', 'New workspace question'), knowledgeBaseId: 'kb-2' }
    const { requests } = mockAdvancedSearchApi({ initialRuns: [...oldRuns, newRun] })
    const user = userEvent.setup()
    const { queryClient } = renderWithProviders(
      <MemoryRouter initialEntries={['/advanced-search?runId=run-old-0&view=history']}>
        <WorkspaceControls />
        <AdvancedSearchPage />
      </MemoryRouter>,
      { selectedKnowledgeBaseId: 'kb-1' },
    )

    expect(await screen.findByRole('heading', { name: 'run-old-0' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('runId=run-old-0')
    await user.selectOptions(screen.getByLabelText('Status'), 'RUNNING')
    await user.click(await screen.findByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('button', { name: 'Old question 10' })).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('Cancellation state updated')).toBeInTheDocument()

    // Include an inactive result entry to ensure the whole old workspace is evicted.
    const oldResultKey = queryKeys.advancedSearchResult('kb-1', 'run-retained')
    const otherResultKey = queryKeys.advancedSearchResult('kb-2', 'run-retained')
    const retainedResult = { retained: true }
    queryClient.setQueryData(oldResultKey, retainedResult)
    queryClient.setQueryData(otherResultKey, retainedResult)
    const oldKeys = [
      queryKeys.advancedSearchReadiness('kb-1'),
      queryKeys.advancedSearchHistory('kb-1', 'RUNNING', 1, 10),
      queryKeys.advancedSearchRun('kb-1', 'run-old-0'),
      oldResultKey,
    ]
    oldKeys.forEach((key) => expect(queryClient.getQueryData(key)).toBeDefined())
    const cachedKnowledgeBases = queryClient.getQueryData(queryKeys.knowledgeBases())
    expect(cachedKnowledgeBases).toEqual(knowledgeBases)

    await user.click(screen.getByRole('button', { name: action }))

    expect(await screen.findByText('Run selection cleared')).toBeInTheDocument()
    expect(screen.getByText('The previous run selection was cleared because the knowledge base changed. History and readiness are now scoped to the new workspace.')).toBeInTheDocument()
    expect(screen.queryByText('Cancellation state updated')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Current URL')).toHaveTextContent(/^\/advanced-search\?view=history$/)
    expect(screen.getByRole('heading', { name: 'No focused run' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'run-old-0' })).not.toBeInTheDocument()
    expect(screen.getByText(/^Page 1 of /)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByLabelText('Status')).toHaveValue('RUNNING')
    await waitFor(() => expect(queryClient.getQueriesData({ queryKey: queryKeys.advancedSearch('kb-1') })).toEqual([]))
    expect(queryClient.getQueryData(otherResultKey)).toEqual(retainedResult)
    expect(queryClient.getQueryData(queryKeys.knowledgeBases())).toEqual(cachedKnowledgeBases)

    if (action === 'Switch workspace') {
      await waitFor(() => expect(requests.some(({ url }) => {
        const parsed = new URL(url, 'http://test')
        return parsed.pathname === '/api/v1/knowledge-bases/kb-2/queries/advanced-search-runs'
          && parsed.searchParams.get('page') === '0'
          && parsed.searchParams.get('status') === 'RUNNING'
      })).toBe(true))
      expect(await screen.findByText('Ready for advanced search')).toBeInTheDocument()
      await user.selectOptions(screen.getByLabelText('Status'), 'ALL')
      expect(await screen.findByRole('button', { name: 'New workspace question' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Old question 10' })).not.toBeInTheDocument()
    } else {
      expect(screen.getByText('Workspace: None selected')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled()
      expect(screen.queryByText('Ready for advanced search')).not.toBeInTheDocument()
    }
  })

  it.each(['mismatched', 'missing', 'expired'] as const)(
    'clears a %s focused run while preserving the draft, options, and browsed history',
    async (scenario) => {
      const runs = Array.from({ length: 12 }, (_, index) => runDetail(`run-history-${index}`, `Retained question ${index}`, 'RUNNING'))
      const staleRun = runs[10]
      let expired = false
      const { requests } = mockAdvancedSearchApi({
        initialRuns: runs,
        onDetail: (id) => {
          if (id !== staleRun.id) return
          if (scenario === 'mismatched') return jsonResponse(200, { ...staleRun, knowledgeBaseId: 'kb-2' })
          if (scenario === 'missing' || expired) return jsonResponse(404, { title: 'Not found', detail: 'Run is no longer retained' })
        },
      })
      const user = userEvent.setup()
      const { queryClient } = renderWithProviders(
        <MemoryRouter initialEntries={['/advanced-search?view=history']}>
          <WorkspaceControls />
          <AdvancedSearchPage />
        </MemoryRouter>,
        { selectedKnowledgeBaseId: 'kb-1' },
      )

      await user.type(await screen.findByLabelText('Question'), 'Keep my next question')
      await user.click(screen.getByRole('button', { name: 'Advanced options' }))
      await user.type(screen.getByLabelText('Maximum evidence'), '17')
      await user.click(screen.getByLabelText('Include evidence text'))
      await user.selectOptions(screen.getByLabelText('Status'), 'RUNNING')
      await user.click(screen.getByRole('button', { name: 'Next' }))
      await user.click(await screen.findByRole('button', { name: staleRun.query }))

      if (scenario === 'expired') {
        expect(await screen.findByRole('heading', { name: staleRun.id })).toBeInTheDocument()
        expect(screen.getByLabelText('Current URL')).toHaveTextContent(`runId=${staleRun.id}`)
        // A previously loaded run disappears from retention on the next detail refresh.
        expired = true
        await act(async () => {
          await queryClient.refetchQueries({ queryKey: queryKeys.advancedSearchRun('kb-1', staleRun.id), exact: true })
        })
      }

      const notice = scenario === 'mismatched' ? 'Run selection cleared' : 'Run is no longer available'
      expect(await screen.findByText(notice)).toBeInTheDocument()
      expect(screen.getByText(scenario === 'mismatched'
        ? 'This run belongs to a different knowledge base, so it was not selected automatically.'
        : 'This run may have expired or may not belong to the selected knowledge base. Your question, options, and history were preserved.',
      )).toBeInTheDocument()
      await waitFor(() => expect(screen.getByLabelText('Current URL')).toHaveTextContent(/^\/advanced-search\?view=history$/))
      expect(screen.getByRole('heading', { name: 'No focused run' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: staleRun.id })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
      expect(screen.getByText('Select a retained history row or submit a new search to monitor its lifecycle here.')).toBeInTheDocument()
      expect(screen.getByText('Workspace: Research')).toBeInTheDocument()
      expect(screen.getByLabelText('Question')).toHaveValue('Keep my next question')
      expect(screen.getByRole('button', { name: 'Hide advanced options' })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByLabelText('Maximum evidence')).toHaveValue(17)
      expect(screen.getByLabelText('Include evidence text')).not.toBeChecked()
      expect(screen.getByRole('button', { name: 'Submit search' })).toBeEnabled()
      expect(screen.getByLabelText('Status')).toHaveValue('RUNNING')
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
      expect(screen.getByRole('button', { name: staleRun.query })).toBeInTheDocument()
      expect(requests.filter(({ url }) => url.endsWith(`/advanced-search-runs/${staleRun.id}`))).toHaveLength(scenario === 'expired' ? 2 : 1)

      // Follow the recovery guidance by selecting another retained run on the same page.
      await user.click(screen.getByRole('button', { name: runs[11].query }))
      expect(await screen.findByRole('heading', { name: runs[11].id })).toBeInTheDocument()
      expect(screen.getByLabelText('Current URL')).toHaveTextContent(`runId=${runs[11].id}`)
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Question')).toHaveValue('Keep my next question')
    },
  )

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

  it.each([1, 20])('accepts the maximum-evidence boundary %i as a numeric request value', async (maximumEvidence) => {
    const { requests } = mockAdvancedSearchApi()
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Question'), '  Find boundary evidence  ')
    await user.click(screen.getByRole('button', { name: 'Advanced options' }))
    await user.type(screen.getByLabelText('Maximum evidence'), String(maximumEvidence))
    await user.click(screen.getByLabelText('Include evidence text'))
    expect(screen.getByLabelText('Maximum evidence')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Submit search' }))

    expect(await screen.findByText('Search run accepted')).toBeInTheDocument()
    const posts = requests.filter(({ init }) => init?.method === 'POST')
    expect(posts).toHaveLength(1)
    expect(posts[0].url).toBe('/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs')
    expect(JSON.parse(String(posts[0].init?.body))).toEqual({ query: 'Find boundary evidence', maximumEvidence, includeEvidenceText: false })
  })

  it.each(['0', '-1', '21', '1.5'])('rejects maximum evidence %s and recovers when cleared', async (invalidValue) => {
    const { requests } = mockAdvancedSearchApi()
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Question'), 'Find evidence')
    await user.click(screen.getByRole('button', { name: 'Advanced options' }))
    const evidence = screen.getByLabelText('Maximum evidence')
    await user.type(evidence, invalidValue)
    expect(evidence).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Maximum evidence must be an integer from 1 through 20.')).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Submit search' })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(requests.filter(({ init }) => init?.method === 'POST')).toHaveLength(0)

    await user.clear(evidence)
    expect(evidence).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText('Maximum evidence must be an integer from 1 through 20.')).not.toBeInTheDocument()
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(await screen.findByText('Search run accepted')).toBeInTheDocument()
    const posts = requests.filter(({ init }) => init?.method === 'POST')
    expect(posts).toHaveLength(1)
    expect(JSON.parse(String(posts[0].init?.body))).toEqual({ query: 'Find evidence', includeEvidenceText: true })
  })

  it.each([
    [429, 'Search queue is full', 'try again shortly'],
    [409, 'Search readiness changed', 'Refresh schema'],
    [500, 'Search submission failed', 'Search service unavailable'],
  ] as const)('preserves the workspace after a %i submission failure and allows retry', async (status, title, message) => {
    let finishSubmission!: (response: ReturnType<typeof jsonResponse>) => void
    const response = new Promise<ReturnType<typeof jsonResponse>>((resolve) => { finishSubmission = resolve })
    const options = { onSubmit: () => response }
    const { requests } = mockAdvancedSearchApi(options)
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Earlier question' }))
    expect(await screen.findByRole('heading', { name: 'run-old' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'COMPLETED')
    await user.type(screen.getByLabelText('Question'), 'Keep this draft')
    await user.click(screen.getByRole('button', { name: 'Advanced options' }))
    await user.type(screen.getByLabelText('Maximum evidence'), '17')
    await user.click(screen.getByLabelText('Include evidence text'))
    const readinessCount = requests.filter(({ url }) => url.endsWith('/readiness')).length
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    const pending = await screen.findByRole('button', { name: 'Submitting...' })
    expect(pending).toBeDisabled()
    await user.click(pending)
    expect(requests.filter(({ init }) => init?.method === 'POST')).toHaveLength(1)

    finishSubmission(jsonResponse(status, {
      title: 'Search service unavailable', detail: 'Search service unavailable',
      blockers: [{ code: 'SCHEMA_CHANGED', description: 'Refresh schema' }],
    }))
    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(message))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'run-old' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Earlier question' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question')).toHaveValue('Keep this draft')
    expect(screen.getByLabelText('Maximum evidence')).toHaveValue(17)
    expect(screen.getByLabelText('Include evidence text')).not.toBeChecked()
    expect(screen.getByLabelText('Status')).toHaveValue('COMPLETED')
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeEnabled()
    expect(screen.queryByText('Search run accepted')).not.toBeInTheDocument()
    if (status === 409) {
      expect(requests.filter(({ url }) => url.endsWith('/readiness')).length).toBeGreaterThan(readinessCount)
    }
    const posts = requests.filter(({ init }) => init?.method === 'POST')
    expect(posts).toHaveLength(1)
    expect(posts[0].url).toBe('/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs')
    expect(JSON.parse(String(posts[0].init?.body))).toEqual({ query: 'Keep this draft', maximumEvidence: 17, includeEvidenceText: false })

    options.onSubmit = async () => jsonResponse(201, runDetail('run-retry', 'Keep this draft'))
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    expect(await screen.findByText('Search run accepted')).toBeInTheDocument()
    expect(screen.queryByText(title)).not.toBeInTheDocument()
    expect(requests.filter(({ init }) => init?.method === 'POST')).toHaveLength(2)
  })

  it('disables resubmission when a conflict refresh reveals a readiness blocker', async () => {
    const readiness = {
      knowledgeBaseId: 'kb-1', ready: true, profileId: 'profile-1', profileRevision: 2,
      graphBranchAvailable: true, embeddedCorpusPresent: true,
      blockers: [] as Array<{ code: string; description: string }>, informational: [],
    }
    const { requests } = mockAdvancedSearchApi({
      readiness,
      onSubmit: () => {
        readiness.ready = false
        readiness.blockers = [{ code: 'AI_PROFILE_MISSING', description: 'Assign an AI profile' }]
        return jsonResponse(409, { title: 'Readiness changed' })
      },
    })
    const user = userEvent.setup()
    renderPage()
    await user.type(await screen.findByLabelText('Question'), 'Preserve blocked draft')
    await user.click(screen.getByRole('button', { name: 'Submit search' }))

    expect(await screen.findByText('Search readiness changed')).toBeInTheDocument()
    expect(screen.getByText('Submission blockers')).toBeInTheDocument()
    expect(screen.getAllByText(/AI_PROFILE_MISSING/).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Question')).toHaveValue('Preserve blocked draft')
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Submit search' }))
    expect(requests.filter(({ init }) => init?.method === 'POST')).toHaveLength(1)
    expect(requests.filter(({ url }) => url.endsWith('/readiness')).length).toBeGreaterThan(1)
  })

  it.each(['QUEUED', 'RUNNING'] as const)('restores cancellation after failure for a %s run and hides it after acceptance', async (status) => {
    const run = runDetail('run-active', 'Active question', status)
    let finishCancel!: (response: ReturnType<typeof jsonResponse>) => void
    const response = new Promise<ReturnType<typeof jsonResponse>>((resolve) => { finishCancel = resolve })
    const options = { initialRuns: [run], onCancel: () => response }
    const { requests } = mockAdvancedSearchApi(options)
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: run.query }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    const pending = await screen.findByRole('button', { name: 'Cancelling...' })
    expect(pending).toBeDisabled()
    await user.click(pending)
    finishCancel(jsonResponse(500, { detail: 'Cancellation service unavailable' }))

    expect(await screen.findByText('Cancellation failed')).toBeInTheDocument()
    expect(screen.getByText('Cancellation service unavailable')).toBeInTheDocument()
    expect(screen.getByText('Not requested')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: run.id })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    const posts = requests.filter(({ init }) => init?.method === 'POST')
    expect(posts).toHaveLength(1)
    expect(posts[0].url).toBe('/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs/run-active/cancel')
    expect(posts[0].init?.body).toBeUndefined()

    options.onCancel = async () => {
      run.cancellationRequested = true
      return jsonResponse(200, run)
    }
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText('Cancellation state updated')).toBeInTheDocument()
    expect(screen.getByText('Requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByText('Cancellation failed')).not.toBeInTheDocument()
    expect(requests.filter(({ init }) => init?.method === 'POST')).toHaveLength(2)
  })

  it('refreshes canonical terminal state when cancellation races with completion', async () => {
    const run = runDetail('run-race', 'Racing question', 'RUNNING')
    const { requests } = mockAdvancedSearchApi({
      initialRuns: [run],
      onCancel: () => {
        Object.assign(run, runDetail(run.id, run.query, 'COMPLETED'))
        return jsonResponse(409, { detail: 'Already completed' })
      },
    })
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: run.query }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText('Run completed before cancellation')).toBeInTheDocument()
    expect(screen.getByText('The cancellation request raced with a terminal transition. The backend state is shown below.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: run.id })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Result handoff eligible' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByText('Cancellation failed')).not.toBeInTheDocument()
    expect(requests.filter(({ url }) => url.endsWith('/advanced-search-runs/run-race'))).toHaveLength(2)
    expect(requests.filter(({ init }) => init?.method === 'POST').map(({ url }) => url)).toEqual([
      '/api/v1/knowledge-bases/kb-1/queries/advanced-search-runs/run-race/cancel',
    ])
  })

  it.each([
    ['COMPLETED', 'Result handoff eligible'],
    ['PARTIAL', 'Result handoff eligible'],
    ['FAILED', 'Run failed'],
    ['CANCELLED', 'Run cancelled'],
    ['INTERRUPTED', 'Run interrupted'],
  ] as const)('does not offer cancellation for a %s run', async (status, notice) => {
    const run = runDetail('run-terminal', 'Terminal question', status)
    const { requests } = mockAdvancedSearchApi({ initialRuns: [run] })
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: run.query }))

    expect(await screen.findByRole('heading', { name: run.id })).toBeInTheDocument()
    expect(screen.getByText(notice)).toBeInTheDocument()
    expect(screen.getByText('Not requested')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(requests.filter(({ init }) => init?.method === 'POST')).toHaveLength(0)
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
