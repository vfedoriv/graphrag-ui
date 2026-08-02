import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useDocumentsQuery } from '../../api/documents'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { Input } from '../../shared/ui/Input'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { OperationSpine, Notice, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'
import { RuntimeContextSummary } from '../../shared/ui/RuntimeContextSummary'
import {
  canFetchAdvancedSearchResult,
  useAdvancedSearchHistoryQuery,
  useAdvancedSearchReadinessQuery,
  useAdvancedSearchResultQuery,
  useAdvancedSearchRunQuery,
  useCancelAdvancedSearchMutation,
  useCreateAdvancedSearchMutation,
} from '../../api/advancedSearch'
import { AdvancedSearchResultPanel } from './AdvancedSearchResult'
import { AdvancedSearchResultFetchError } from './AdvancedSearchResultFetchError'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { queryKeys } from '../../api/queryKeys'
import { useRuntimeSettingsQuery } from '../../api/runtimeSettings'
import { ApiError, type AdvancedSearchReadinessIssue, type AdvancedSearchResultParseResult, type AdvancedSearchRunDetail, type AdvancedSearchRunStatus, type AdvancedSearchRunSummary, type DocumentUpload, type RuntimeSetting } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'

const HISTORY_PAGE_SIZE = 10
const MAXIMUM_EVIDENCE_MIN = 1
const MAXIMUM_EVIDENCE_MAX = 20
const RUN_STATUSES: Array<AdvancedSearchRunStatus | 'ALL'> = ['ALL', 'QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'INTERRUPTED']

type NoticeState = {
  title: string
  message: string
  tone?: 'info' | 'success' | 'warning' | 'danger'
}

export function AdvancedSearchPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const runId = searchParams.get('runId')
  const [question, setQuestion] = useState('')
  const [maximumEvidence, setMaximumEvidence] = useState('')
  const [includeEvidenceText, setIncludeEvidenceText] = useState(true)
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false)
  const [maximumEvidenceError, setMaximumEvidenceError] = useState<string | null>(null)
  const [submissionNotice, setSubmissionNotice] = useState<NoticeState | null>(null)
  const [pageNotice, setPageNotice] = useState<NoticeState | null>(null)
  const [historyStatus, setHistoryStatus] = useState<AdvancedSearchRunStatus | 'ALL'>('ALL')
  const [historyPage, setHistoryPage] = useState(0)
  const previousKnowledgeBaseId = useRef(selectedKnowledgeBaseId)
  const knowledgeBaseEffectInitialized = useRef(false)
  const previousFocusedStatus = useRef<AdvancedSearchRunStatus | null>(null)

  const activeKnowledgeBase = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null
  const readinessQuery = useAdvancedSearchReadinessQuery(selectedKnowledgeBaseId)
  const historyQuery = useAdvancedSearchHistoryQuery(
    selectedKnowledgeBaseId,
    historyStatus === 'ALL' ? null : historyStatus,
    historyPage,
    HISTORY_PAGE_SIZE,
  )
  const runQuery = useAdvancedSearchRunQuery(selectedKnowledgeBaseId, runId)
  const focusedStatus = runQuery.data?.status ?? null
  const resultQuery = useAdvancedSearchResultQuery(selectedKnowledgeBaseId, runId, focusedStatus)
  const documentsQuery = useDocumentsQuery(selectedKnowledgeBaseId)
  const runtimeSettingsQuery = useRuntimeSettingsQuery()
  const createMutation = useCreateAdvancedSearchMutation()
  const cancelMutation = useCancelAdvancedSearchMutation()

  const evidenceHints = useMemo(() => getEvidenceHints(runtimeSettingsQuery.data ?? []), [runtimeSettingsQuery.data])
  const cachedDocuments = Array.isArray(documentsQuery.data) ? documentsQuery.data : []
  const readiness = readinessQuery.data
  const blockers = readiness?.blockers ?? []
  const informational = readiness?.informational ?? []
  const schemaUnavailable = informational.find((issue) => issue.code === 'SCHEMA_UNAVAILABLE')
  const emptyCorpus = informational.find((issue) => issue.code === 'EMPTY_CORPUS')
  const questionIsValid = question.trim().length > 0
  const canSubmit = Boolean(
    selectedKnowledgeBaseId
      && readiness?.ready
      && questionIsValid
      && !maximumEvidenceError
      && !createMutation.isPending,
  )

  const updateRunId = useCallback((nextRunId: string | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextRunId) next.set('runId', nextRunId)
      else next.delete('runId')
      return next
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    if (!knowledgeBaseEffectInitialized.current) {
      knowledgeBaseEffectInitialized.current = true
      previousKnowledgeBaseId.current = selectedKnowledgeBaseId
      return
    }
    const previousId = previousKnowledgeBaseId.current
    if (previousId !== selectedKnowledgeBaseId && (previousId !== null || runId)) {
      updateRunId(null)
      queueMicrotask(() => {
        setHistoryPage(0)
        setPageNotice({
          title: 'Run selection cleared',
          message: 'The previous run selection was cleared because the knowledge base changed. History and readiness are now scoped to the new workspace.',
          tone: 'info',
        })
      })
      if (previousId) queryClient.removeQueries({ queryKey: queryKeys.advancedSearch(previousId) })
    }
    previousKnowledgeBaseId.current = selectedKnowledgeBaseId
  }, [queryClient, runId, selectedKnowledgeBaseId, updateRunId])

  useEffect(() => {
    if (!runQuery.data) return
    if (runQuery.data.knowledgeBaseId !== selectedKnowledgeBaseId) {
      updateRunId(null)
      queueMicrotask(() => setPageNotice({
          title: 'Run selection cleared',
          message: 'This run belongs to a different knowledge base, so it was not selected automatically.',
          tone: 'warning',
        }))
      return
    }

    const status = runQuery.data.status
    if (isTerminalStatus(status) && previousFocusedStatus.current !== status) {
      void queryClient.invalidateQueries({ queryKey: ['advanced-search', selectedKnowledgeBaseId ?? '', 'history'] })
    }
    previousFocusedStatus.current = status
  }, [queryClient, runQuery.data, selectedKnowledgeBaseId, updateRunId])

  useEffect(() => {
    const error = runQuery.error
    if (!error || !runId || !isNotFoundError(error)) return
    updateRunId(null)
    queueMicrotask(() => setPageNotice({
        title: 'Run is no longer available',
        message: 'This run may have expired or may not belong to the selected knowledge base. Your question, options, and history were preserved.',
        tone: 'warning',
      }))
  }, [runId, runQuery.error, updateRunId])

  const validateMaximumEvidence = (value: string) => {
    if (!value.trim()) {
      setMaximumEvidenceError(null)
      return true
    }
    const number = Number(value)
    if (!Number.isInteger(number) || number < MAXIMUM_EVIDENCE_MIN || number > MAXIMUM_EVIDENCE_MAX) {
      setMaximumEvidenceError(`Maximum evidence must be an integer from ${MAXIMUM_EVIDENCE_MIN} through ${MAXIMUM_EVIDENCE_MAX}.`)
      return false
    }
    setMaximumEvidenceError(null)
    return true
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmissionNotice(null)
    if (!validateMaximumEvidence(maximumEvidence) || !questionIsValid || !selectedKnowledgeBaseId || !readiness?.ready) return

    try {
      const run = await createMutation.mutateAsync({
        knowledgeBaseId: selectedKnowledgeBaseId,
        payload: {
          query: question.trim(),
          maximumEvidence: maximumEvidence.trim() || undefined,
          includeEvidenceText,
        },
      })
      queryClient.setQueryData(queryKeys.advancedSearchRun(selectedKnowledgeBaseId, run.id), run)
      updateRunId(run.id)
      setSubmissionNotice({
        title: 'Search run accepted',
        message: 'The new durable run is focused below. Existing runs continue server-side and remain in history.',
        tone: 'success',
      })
    } catch (error) {
      const apiError = asApiError(error)
      if (apiError?.status === 429) {
        setSubmissionNotice({
          title: 'Search queue is full',
          message: 'The backend did not accept a new run. Your question, options, focused run, and history were preserved; try again shortly.',
          tone: 'warning',
        })
        return
      }
      if (apiError?.status === 409) {
        const refreshed = await readinessQuery.refetch()
        const machineIssues = extractProblemIssues(apiError)
        setSubmissionNotice({
          title: 'Search readiness changed',
          message: formatConflictMessage(machineIssues, refreshed.data?.blockers ?? []),
          tone: 'warning',
        })
        void readinessQuery.refetch()
        return
      }
      setSubmissionNotice({
        title: 'Search submission failed',
        message: apiError?.message ?? 'The backend could not accept this search run. Your draft and history were preserved.',
        tone: 'danger',
      })
    }
  }

  const cancel = async () => {
    if (!selectedKnowledgeBaseId || !runId || !runQuery.data) return
    try {
      const canonicalRun = await cancelMutation.mutateAsync({ knowledgeBaseId: selectedKnowledgeBaseId, runId })
      queryClient.setQueryData<AdvancedSearchRunDetail>(queryKeys.advancedSearchRun(selectedKnowledgeBaseId, runId), (current) =>
        current ? { ...current, ...canonicalRun } : current,
      )
      setPageNotice({ title: 'Cancellation state updated', message: 'The backend returned the canonical state for this run.', tone: 'info' })
    } catch (error) {
      const apiError = asApiError(error)
      if (apiError?.status === 409) {
        await runQuery.refetch()
        setPageNotice({ title: 'Run completed before cancellation', message: 'The cancellation request raced with a terminal transition. The backend state is shown below.', tone: 'info' })
        return
      }
      setPageNotice({ title: 'Cancellation failed', message: apiError?.message ?? 'The run could not be cancelled. Its lifecycle state remains available.', tone: 'danger' })
    }
  }

  const history = historyQuery.data
  const totalHistoryPages = history ? Math.max(1, Math.ceil(history.totalElements / HISTORY_PAGE_SIZE)) : 1
  const readinessError = readinessQuery.error as Error | null

  return (
    <ControllerPage
      title='Advanced Search'
      eyebrow='Durable run workspace'
      description='Submit readiness-aware searches, monitor one focused run, and revisit retained runs without losing concurrent work.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Workspace', value: activeKnowledgeBase?.name ?? selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'Readiness', value: !selectedKnowledgeBaseId ? 'Select a knowledge base' : readinessQuery.isLoading ? 'Checking' : readiness?.ready ? 'Ready' : 'Blocked', tone: readiness?.ready ? 'success' : readinessQuery.isLoading ? 'neutral' : 'warning' },
            { label: 'Focused run', value: runId ?? 'None' },
          ]}
        />
      }
      topSectionTitle='Search workspace'
      topSectionDescription='The question is the primary control. Evidence tuning stays per run and follows backend defaults when left blank.'
      topSectionStatus={<StatusBadge label={createMutation.isPending ? 'Submitting' : readiness?.ready ? 'Ready to submit' : 'Needs attention'} tone={createMutation.isPending ? 'warning' : readiness?.ready ? 'success' : 'neutral'} />}
      topSection={
        <div className='stack-lg'>
          {pageNotice ? <Notice title={pageNotice.title} tone={pageNotice.tone}>{pageNotice.message}</Notice> : null}
          {submissionNotice ? <Notice title={submissionNotice.title} tone={submissionNotice.tone}>{submissionNotice.message}</Notice> : null}
          <ReadinessPanel
            selectedKnowledgeBaseId={selectedKnowledgeBaseId}
            readiness={readiness}
            isLoading={readinessQuery.isLoading}
            error={readinessError}
            blockers={blockers}
            schemaUnavailable={schemaUnavailable}
            emptyCorpus={emptyCorpus}
          />
          <RuntimeContextSummary
            knowledgeBaseId={selectedKnowledgeBaseId}
            settingHints={['advanced', 'search', 'evidence']}
            title='Advanced Search runtime context'
          />

          <form className='stack' onSubmit={submit}>
            <FieldLabel htmlFor='advanced-search-question'>Question</FieldLabel>
            <Textarea
              id='advanced-search-question'
              rows={4}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder='Ask a question about this knowledge base'
            />
            <div className='toolbar'>
              <Button type='submit' variant='primary' isPending={createMutation.isPending} pendingText='Submitting...' disabled={!canSubmit}>
                Submit search
              </Button>
              <Button
                type='button'
                variant='ghost'
                aria-expanded={advancedOptionsOpen}
                aria-controls='advanced-search-options'
                onClick={() => setAdvancedOptionsOpen((open) => !open)}
              >
                {advancedOptionsOpen ? 'Hide advanced options' : 'Advanced options'}
              </Button>
            </div>
            {advancedOptionsOpen ? (
              <div id='advanced-search-options' className='flow-card'>
                <div className='grid two'>
                  <div className='stack'>
                    <FieldLabel htmlFor='advanced-search-maximum-evidence'>Maximum evidence</FieldLabel>
                    <Input
                      id='advanced-search-maximum-evidence'
                      type='number'
                      min={MAXIMUM_EVIDENCE_MIN}
                      max={MAXIMUM_EVIDENCE_MAX}
                      step={1}
                      value={maximumEvidence}
                      onChange={(event) => {
                        setMaximumEvidence(event.target.value)
                        validateMaximumEvidence(event.target.value)
                      }}
                      placeholder='Backend default'
                      aria-invalid={Boolean(maximumEvidenceError)}
                    />
                    {maximumEvidenceError ? <p className='muted'>{maximumEvidenceError}</p> : null}
                    {evidenceHints.defaultHint !== undefined ? <p className='muted'>Backend default hint: {formatHint(evidenceHints.defaultHint)}</p> : null}
                    {evidenceHints.maximumHint !== undefined ? <p className='muted'>Backend maximum hint: {formatHint(evidenceHints.maximumHint)}</p> : null}
                  </div>
                  <label htmlFor='advanced-search-include-evidence-text' className='check-row'>
                    <input
                      id='advanced-search-include-evidence-text'
                      type='checkbox'
                      checked={includeEvidenceText}
                      onChange={(event) => setIncludeEvidenceText(event.target.checked)}
                    />
                    Include evidence text
                  </label>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      }
      tabs={
        <div className='stack-lg'>
          <FocusedRunPanel
            runId={runId}
            run={runQuery.data}
            isLoading={runQuery.isLoading}
            isFetching={runQuery.isFetching}
            error={runQuery.error as Error | null}
            result={resultQuery.data}
            resultLoading={resultQuery.isLoading}
            resultFetching={resultQuery.isFetching}
            resultError={resultQuery.error as Error | null}
            documents={cachedDocuments}
            isCancelling={cancelMutation.isPending}
            onCancel={cancel}
          />
          <HistoryPanel
            history={history}
            isLoading={historyQuery.isLoading}
            isFetching={historyQuery.isFetching}
            error={historyQuery.error as Error | null}
            status={historyStatus}
            page={historyPage}
            totalPages={totalHistoryPages}
            onStatusChange={(status) => {
              setHistoryStatus(status)
              setHistoryPage(0)
            }}
            onPageChange={setHistoryPage}
            onSelect={updateRunId}
          />
        </div>
      }
      tabsTitle='Focused run and history'
      tabsDescription='Only the focused non-terminal run is polled. History is refreshed when lifecycle state becomes terminal and can be browsed independently.'
      tabsStatus={<StatusBadge label={historyQuery.isFetching ? 'Refreshing history' : `${history?.totalElements ?? 0} retained runs`} tone='neutral' />}
      testId='advanced-search-controller-page'
    />
  )
}

function ReadinessPanel({
  selectedKnowledgeBaseId,
  readiness,
  isLoading,
  error,
  blockers,
  schemaUnavailable,
  emptyCorpus,
}: {
  selectedKnowledgeBaseId: string | null
  readiness?: ReadinessPanelProps['readiness']
  isLoading: boolean
  error: Error | null
  blockers: AdvancedSearchReadinessIssue[]
  schemaUnavailable?: AdvancedSearchReadinessIssue
  emptyCorpus?: AdvancedSearchReadinessIssue
}) {
  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base in the workspace switcher before checking advanced-search readiness.' tone='info' />
  }
  if (isLoading) return <div className='inline-state'>Checking advanced-search readiness for {selectedKnowledgeBaseId}...</div>
  if (error) return <Alert title='Readiness check failed' message={`${error.message} Submission is disabled until readiness can be confirmed.`} />
  if (!readiness) return <div className='inline-state'>Readiness has not been loaded yet.</div>

  return (
    <div className='stack'>
      <OperationSpine
        ariaLabel='Advanced search readiness'
        items={[
          { eyebrow: 'Profile', title: readiness.profileId ?? 'None assigned', body: readiness.profileRevision ? `Revision ${readiness.profileRevision}` : 'No active AI profile revision' },
          { eyebrow: 'Graph branch', title: readiness.graphBranchAvailable ? 'Available' : 'Unavailable', body: readiness.graphBranchAvailable ? 'Graph retrieval can participate.' : 'Text-only retrieval may still be allowed.' },
          { eyebrow: 'Embedded corpus', title: readiness.embeddedCorpusPresent ? 'Present' : 'Empty', body: readiness.embeddedCorpusPresent ? 'Embedded evidence is available.' : 'Runs may return insufficient evidence.' },
          { eyebrow: 'Admission', title: readiness.ready ? 'Ready' : 'Blocked', body: readiness.ready ? 'Valid submissions are enabled.' : `${blockers.length} blocker${blockers.length === 1 ? '' : 's'}` },
        ]}
      />
      {blockers.length > 0 ? (
        <div className='notice danger'>
          <strong>Submission blockers</strong>
          <ul>
            {blockers.map((issue) => <li key={`${issue.code}-${issue.description}`}><code>{issue.code}</code>: {issue.description}</li>)}
          </ul>
        </div>
      ) : null}
      {schemaUnavailable ? <Alert title='Text-only search available' message={`${schemaUnavailable.description} Graph retrieval is unavailable, but text-only search remains allowed.`} tone='info' /> : null}
      {emptyCorpus ? <Alert title='Embedded corpus is empty' message={`${emptyCorpus.description} A run may return insufficient evidence; this is informational and does not block submission.`} tone='info' /> : null}
      {readiness.ready && blockers.length === 0 && !schemaUnavailable && !emptyCorpus ? <Alert title='Ready for advanced search' message='Readiness checks passed for the selected knowledge base.' tone='success' /> : null}
    </div>
  )
}

type ReadinessPanelProps = {
  readiness?: {
    profileId: string | null
    profileRevision: number
    graphBranchAvailable: boolean
    embeddedCorpusPresent: boolean
    ready: boolean
  }
}

function FocusedRunPanel({
  runId,
  run,
  isLoading,
  isFetching,
  error,
  result,
  resultLoading,
  resultFetching,
  resultError,
  documents,
  isCancelling,
  onCancel,
}: {
  runId: string | null
  run?: AdvancedSearchRunDetail
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  result?: AdvancedSearchResultParseResult
  resultLoading: boolean
  resultFetching: boolean
  resultError: Error | null
  documents: DocumentUpload[]
  isCancelling: boolean
  onCancel: () => void
}) {
  if (!runId) {
    return <section className='flow-card'><h3>No focused run</h3><p>Select a retained history row or submit a new search to monitor its lifecycle here.</p></section>
  }
  if (isLoading) return <section className='flow-card'><h3>Loading focused run</h3><p>Loading retained detail for <code>{runId}</code>...</p></section>
  if (error && !isNotFoundError(error)) return <Alert title='Focused run unavailable' message={error.message} />
  if (!run) return <section className='flow-card'><h3>Focused run unavailable</h3><p>The run detail has not returned yet.</p></section>

  const terminal = isTerminalStatus(run.status)
  const resultEligible = canFetchAdvancedSearchResult(run.status)

  return (
    <section className='stack'>
      <div className='flow-card'>
        <div className='split-stack'>
          <div>
            <p className='eyebrow'>Focused run</p>
            <h3>{run.id}</h3>
          </div>
          <div className='toolbar'>
            <StatusBadge label={run.status} tone={statusTone(run.status)} />
            {isFetching && !terminal ? <StatusBadge label='Polling 1.5s' tone='neutral' /> : null}
            {canCancelRun(run) ? <Button type='button' variant='danger' isPending={isCancelling} pendingText='Cancelling...' onClick={onCancel}>Cancel</Button> : null}
          </div>
        </div>
        <OutputPreview label='Full query'>{run.query}</OutputPreview>
        <dl className='grid three'>
          <div><dt className='font-semibold'>Maximum evidence</dt><dd>{run.maximumEvidence}</dd></div>
          <div><dt className='font-semibold'>Evidence text</dt><dd>{run.includeEvidenceText ? 'Included' : 'Omitted'}</dd></div>
          <div><dt className='font-semibold'>Stage</dt><dd>{run.stage}</dd></div>
          <div><dt className='font-semibold'>Branch progress</dt><dd>{run.completedBranches} / {run.totalBranches}</dd></div>
          <div><dt className='font-semibold'>Evidence count</dt><dd>{run.evidenceCount}</dd></div>
          <div><dt className='font-semibold'>Cancellation</dt><dd>{run.cancellationRequested ? 'Requested' : 'Not requested'}</dd></div>
          <div><dt className='font-semibold'>Created</dt><dd>{formatTimestamp(run.createdAt)}</dd></div>
          <div><dt className='font-semibold'>Started</dt><dd>{formatTimestamp(run.startedAt)}</dd></div>
          <div><dt className='font-semibold'>Deadline</dt><dd>{formatTimestamp(run.deadlineAt)}</dd></div>
          <div><dt className='font-semibold'>Completed</dt><dd>{formatTimestamp(run.completedAt)}</dd></div>
          <div><dt className='font-semibold'>Failure category</dt><dd>{run.failureCategory ?? 'None reported'}</dd></div>
        </dl>
      </div>
      {run.status === 'INTERRUPTED' ? <Alert title='Run interrupted' message='The backend interrupted this run. Lifecycle and failure context remain available in the focused detail.' /> : null}
      {run.status === 'FAILED' ? <Alert title='Run failed' message={run.failureCategory ?? 'The run failed without a categorized failure.'} /> : null}
      {run.status === 'CANCELLED' ? <Alert title='Run cancelled' message='This run was cancelled. Result retrieval remains disabled unless the backend explicitly exposes a result.' tone='info' /> : null}
      {resultEligible ? (
        <div className='flow-card'>
          <h3>Result handoff eligible</h3>
          {resultLoading && !result ? <p>Loading the retained result resource...</p> : null}
          {resultFetching && !resultLoading ? <p className='muted'>Refreshing retained result...</p> : null}
          {resultError ? <AdvancedSearchResultFetchError error={resultError} /> : null}
          {result ? <AdvancedSearchResultPanel parsed={result} runStatus={run.status} runFailureCategory={run.failureCategory} documents={documents} /> : null}
        </div>
      ) : null}
    </section>
  )
}

function HistoryPanel({
  history,
  isLoading,
  isFetching,
  error,
  status,
  page,
  totalPages,
  onStatusChange,
  onPageChange,
  onSelect,
}: {
  history?: { page: number; size: number; totalElements: number; content: AdvancedSearchRunSummary[] }
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  status: AdvancedSearchRunStatus | 'ALL'
  page: number
  totalPages: number
  onStatusChange: (status: AdvancedSearchRunStatus | 'ALL') => void
  onPageChange: (page: number) => void
  onSelect: (runId: string) => void
}) {
  const rows = history?.content ?? []
  return (
    <section className='stack'>
      <div className='split-stack'>
        <div>
          <p className='eyebrow'>Server-paged history</p>
          <h3>Retained runs</h3>
        </div>
        <label className='field-label' htmlFor='advanced-search-history-status'>
          Status
          <select id='advanced-search-history-status' value={status} onChange={(event) => onStatusChange(event.target.value as AdvancedSearchRunStatus | 'ALL')}>
            {RUN_STATUSES.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item}</option>)}
          </select>
        </label>
      </div>
      {isLoading ? <div className='inline-state'>Loading run history...</div> : null}
      {error ? <Alert title='History unavailable' message={error.message} /> : null}
      {!isLoading && !error && rows.length === 0 ? <div className='inline-state'>No retained runs match this status filter.</div> : null}
      {rows.length > 0 ? (
        <Table
          ariaLabel='Advanced search run history'
          headers={['Query', 'Status', 'Stage', 'Options', 'Timestamps']}
          rowKeys={rows.map((row) => row.id)}
          rows={rows.map((row) => [
            <button key={row.id} type='button' className='schema-draft-target-link' onClick={() => onSelect(row.id)}>{row.queryPreview}</button>,
            <StatusBadge key={`${row.id}-status`} label={row.status} tone={statusTone(row.status)} />,
            row.stage,
            `${row.maximumEvidence} evidence · text ${row.includeEvidenceText ? 'on' : 'off'}`,
            <span key={`${row.id}-time`}><strong>{formatTimestamp(row.createdAt)}</strong><small>{row.completedAt ? `Completed ${formatTimestamp(row.completedAt)}` : 'Still active'}</small></span>,
          ])}
        />
      ) : null}
      <div className='split-stack'>
        <span className='muted'>Server total: {history?.totalElements ?? 0}{isFetching ? ' · refreshing' : ''}</span>
        <div className='toolbar'>
          <Button type='button' variant='ghost' disabled={page <= 0} onClick={() => onPageChange(Math.max(0, page - 1))}>Previous</Button>
          <span className='muted'>Page {page + 1} of {totalPages}</span>
          <Button type='button' variant='ghost' disabled={page + 1 >= totalPages} onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}>Next</Button>
        </div>
      </div>
    </section>
  )
}

function getEvidenceHints(settings: RuntimeSetting[]) {
  const relevant = settings.filter((setting) => /advanced|search|evidence/i.test(setting.key) || /advanced|search|evidence/i.test(setting.category))
  const defaultSetting = relevant.find((setting) => /default/i.test(setting.key) && /evidence|maximum|limit/i.test(setting.key))
    ?? relevant.find((setting) => /evidence|maximum|limit/i.test(setting.key))
  const maximumSetting = relevant.find((setting) => /max|maximum|limit/i.test(setting.key) && typeof setting.constraints?.max === 'number')
  const defaultHint = defaultSetting?.defaultValue ?? defaultSetting?.currentValue
  const maximumHint = maximumSetting?.constraints?.max
  return { defaultHint, maximumHint }
}

function formatHint(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)
}

function extractProblemIssues(error: ApiError): AdvancedSearchReadinessIssue[] {
  if (error.fieldErrors) {
    const fieldIssues = Object.entries(error.fieldErrors).flatMap(([code, descriptions]) =>
      descriptions.map((description) => ({ code, description })),
    )
    if (fieldIssues.length > 0) return fieldIssues
  }
  const problem = error.problemDetail
  if (!problem) return []
  const candidates = [problem.blockers, problem.issues, problem.errors]
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const issues = candidate.flatMap((item) => {
      if (typeof item === 'string') return [{ code: 'BACKEND', description: item }]
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        return [{ code: String(record.code ?? 'BACKEND'), description: String(record.description ?? record.detail ?? record.message ?? 'Readiness conflict') }]
      }
      return []
    })
    if (issues.length > 0) return issues
  }
  return []
}

function formatConflictMessage(machineIssues: AdvancedSearchReadinessIssue[], currentBlockers: AdvancedSearchReadinessIssue[]) {
  const issues = machineIssues.length > 0 ? machineIssues : currentBlockers
  if (issues.length === 0) return 'The backend reported a readiness conflict. Readiness was refreshed; review the current state and submit again when permitted.'
  return `The backend reported readiness blockers: ${issues.map((issue) => `${issue.code}: ${issue.description}`).join('; ')} Submit again after the selected knowledge base becomes ready.`
}

function asApiError(error: unknown) {
  return error instanceof ApiError ? error : null
}

function isNotFoundError(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

function isTerminalStatus(status: AdvancedSearchRunStatus) {
  return ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'INTERRUPTED'].includes(status)
}

function canCancelRun(run: AdvancedSearchRunDetail) {
  return (run.status === 'QUEUED' || run.status === 'RUNNING') && !run.cancellationRequested
}

function statusTone(status: AdvancedSearchRunStatus): 'neutral' | 'success' | 'warning' | 'error' {
  if (status === 'COMPLETED') return 'success'
  if (status === 'PARTIAL' || status === 'QUEUED' || status === 'RUNNING') return 'warning'
  if (status === 'FAILED' || status === 'INTERRUPTED') return 'error'
  return 'neutral'
}

function formatTimestamp(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
