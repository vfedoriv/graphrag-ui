import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  ChunkMigrationPreview,
  ChunkReprocessingSelection,
  DocumentUpload,
  ReprocessingPlanDetail,
  ReprocessingPlanItem,
  ReprocessingPlanStatus,
  ReprocessingPlanSummary,
} from '../../api/types'
import {
  useChunkMigrationPreviewQuery,
  useCreateReprocessingPlanMutation,
  useReprocessingPlanDetailQuery,
  useReprocessingPlanHistoryQuery,
  useRetryReprocessingPlanMutation,
} from '../../api/reprocessingPlans'
import { ApiError } from '../../api/types'
import { useDocumentProcessingOptionsQuery, useDocumentsQuery } from '../../api/documents'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import { ProcessingOptionsEditor } from '../documents/DocumentProcessingOptionsWorkflow'
import {
  buildProcessingOptionDraft,
  serializeMutableProcessingOptions,
  type ProcessingOptionDraft,
} from '../documents/processingOptions'

const PAGE_SIZE = 10
const MIGRATION_REASON = 'CHUNK_STRATEGY_MIGRATION' as const
const TERMINAL_PLAN_STATUSES = ['BLOCKED', 'COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED']
const BLOCKER_LABELS: Record<string, string> = {
  ACTIVE_SCHEMA_MISSING: 'Active schema is missing',
  AI_PROFILE_UNRESOLVABLE: 'AI profile cannot be resolved',
  EMBEDDING_SPACE_INCOMPATIBLE: 'Embedding space is incompatible',
  INVALID_MIGRATION_TARGET: 'Migration target is invalid',
  ACTIVE_DESTRUCTIVE_PLAN: 'Another destructive plan is active',
}

type ChunkMigrationWorkflowProps = {
  tabs: ReactNode
  activeKb: string | null
  knowledgeBaseId: string | null
  planId: string | null
  onPlanIdChange: (planId: string | null) => void
}

export function ChunkMigrationWorkflow({
  tabs,
  activeKb,
  knowledgeBaseId,
  planId,
  onPlanIdChange,
}: ChunkMigrationWorkflowProps) {
  const queryClient = useQueryClient()
  const previousKnowledgeBaseId = useRef<string | null | undefined>(undefined)
  const [scope, setScope] = useState<ChunkReprocessingSelection>('OUTDATED_STRATEGY')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [includeOptions, setIncludeOptions] = useState(false)
  const [optionDraft, setOptionDraft] = useState<ProcessingOptionDraft>({})
  const [optionDraftDocumentId, setOptionDraftDocumentId] = useState<string | null>(null)
  const [previewPage, setPreviewPage] = useState(0)
  const [historyPage, setHistoryPage] = useState(0)
  const [itemPage, setItemPage] = useState(0)
  const [historySelection, setHistorySelection] = useState<ChunkReprocessingSelection | ''>('')
  const [historyStatus, setHistoryStatus] = useState<ReprocessingPlanStatus | ''>('')
  const [allConfirmationOpen, setAllConfirmationOpen] = useState(false)
  const [retryConfirmationOpen, setRetryConfirmationOpen] = useState(false)
  const [confirmationFingerprint, setConfirmationFingerprint] = useState<string | null>(null)
  const [admissionConflictMessage, setAdmissionConflictMessage] = useState<string | null>(null)
  const [ownershipNotice, setOwnershipNotice] = useState<string | null>(null)

  const documents = useDocumentsQuery(knowledgeBaseId)
  const ownedDocuments = useMemo(
    () => (documents.data ?? []).filter((document) => document.knowledgeBaseId === knowledgeBaseId),
    [documents.data, knowledgeBaseId],
  )
  const ownedDocumentIds = useMemo(() => new Set(ownedDocuments.map((document) => document.id)), [ownedDocuments])
  const invalidSelectedDocumentIds = selectedDocumentIds.filter((id) => !ownedDocumentIds.has(id))
  const optionsDocumentId = selectedDocumentIds.find((id) => ownedDocumentIds.has(id)) ?? ownedDocuments[0]?.id ?? null
  const processingOptions = useDocumentProcessingOptionsQuery(optionsDocumentId)

  const effectiveOptionDraft = useMemo(
    () => processingOptions.data && optionDraftDocumentId === optionsDocumentId && Object.keys(optionDraft).length > 0
      ? optionDraft
      : processingOptions.data
      ? buildProcessingOptionDraft(processingOptions.data.options)
      : optionDraft,
    [optionDraft, optionDraftDocumentId, optionsDocumentId, processingOptions.data],
  )
  const processingOptionsPayload = includeOptions && processingOptions.data
    ? serializeMutableProcessingOptions(processingOptions.data.options, effectiveOptionDraft)
    : null
  const previewPayload = useMemo(() => {
    if (!knowledgeBaseId || invalidSelectedDocumentIds.length > 0) return null
    if (scope === 'DOCUMENT_IDS' && selectedDocumentIds.length === 0) return null
    if (includeOptions && !processingOptions.data) return null
    return {
      selection: scope,
      ...(scope === 'DOCUMENT_IDS' ? { documentIds: [...selectedDocumentIds] } : {}),
      processingOptions: processingOptionsPayload,
    }
  }, [includeOptions, invalidSelectedDocumentIds, knowledgeBaseId, processingOptions.data, processingOptionsPayload, scope, selectedDocumentIds])
  const previewFingerprint = useMemo(
    () => JSON.stringify({ knowledgeBaseId, payload: previewPayload, page: previewPage, size: PAGE_SIZE }),
    [knowledgeBaseId, previewPage, previewPayload],
  )
  const preview = useChunkMigrationPreviewQuery(knowledgeBaseId, previewPayload, previewPage, PAGE_SIZE)
  const previewMatchesDraft = Boolean(
    preview.data
    && preview.data.knowledgeBaseId === knowledgeBaseId
    && preview.data.selection === scope
    && previewPayload
    && previewFingerprint,
  )
  const previewIdentity = previewMatchesDraft ? JSON.stringify({ fingerprint: previewFingerprint, preview: preview.data }) : null
  const targetRevision = preview.data?.target?.expectedChunkerRevision?.trim() ?? ''
  const previewHasWork = (preview.data?.selectedCount ?? 0) > 0
  const canCreate = Boolean(
    previewMatchesDraft
    && !preview.isFetching
    && preview.data?.ready
    && previewHasWork
    && targetRevision
    && preview.data?.blockers.length === 0
    && !(scope === 'DOCUMENT_IDS' && invalidSelectedDocumentIds.length > 0),
  )
  const history = useReprocessingPlanHistoryQuery(
    knowledgeBaseId,
    {
      reason: MIGRATION_REASON,
      selection: historySelection || null,
      status: historyStatus || null,
    },
    historyPage,
    PAGE_SIZE,
  )
  const plan = useReprocessingPlanDetailQuery(knowledgeBaseId, planId, itemPage, PAGE_SIZE)
  const selectedPlan = plan.data?.id === planId ? plan.data : null
  const selectedPlanSummary = history.data?.content.find((item) => item.id === planId) ?? null
  const createPlan = useCreateReprocessingPlanMutation()
  const retryPlan = useRetryReprocessingPlanMutation()

  useEffect(() => {
    const previous = previousKnowledgeBaseId.current
    previousKnowledgeBaseId.current = knowledgeBaseId
    if (previous === undefined || previous === knowledgeBaseId) return

    setScope('OUTDATED_STRATEGY')
    setSelectedDocumentIds([])
    setIncludeOptions(false)
    setOptionDraft({})
    setOptionDraftDocumentId(null)
    setPreviewPage(0)
    setHistoryPage(0)
    setItemPage(0)
    setAllConfirmationOpen(false)
    setRetryConfirmationOpen(false)
    setConfirmationFingerprint(null)
    setAdmissionConflictMessage(null)
    setOwnershipNotice('The previous migration selection belonged to another knowledge base, so its plan, preview, and document scope were cleared.')
    onPlanIdChange(null)
    if (previous) {
      queryClient.removeQueries({ queryKey: ['chunk-migrations', previous] })
      queryClient.removeQueries({ queryKey: ['reprocessing-plans', previous] })
    }
  }, [knowledgeBaseId, onPlanIdChange, queryClient])

  const invalidDeepLink = Boolean(planId && plan.error instanceof ApiError && plan.error.status === 404)
  const clearInvalidPlanLink = useCallback(() => {
    setOwnershipNotice('That migration plan is not owned by the selected knowledge base, so the invalid plan link was cleared.')
    onPlanIdChange(null)
  }, [onPlanIdChange])

  useEffect(() => {
    if (!invalidDeepLink) return
    const timer = window.setTimeout(clearInvalidPlanLink, 0)
    return () => window.clearTimeout(timer)
  }, [clearInvalidPlanLink, invalidDeepLink])

  const setSelectedIdsFromText = (value: string) => {
    const next = value.split(/[\n,]/).map((id) => id.trim()).filter(Boolean)
    setSelectedDocumentIds([...new Set(next)])
  }

  const updateSelectedDocument = (documentId: string, checked: boolean) => {
    setSelectedDocumentIds((current) => checked
      ? [...new Set([...current, documentId])]
      : current.filter((id) => id !== documentId))
  }

  const createPayload = previewPayload && preview.data?.target ? {
    reason: MIGRATION_REASON,
    selection: scope,
    processingOptions: previewPayload.processingOptions,
    expectedChunkerRevision: preview.data.target.expectedChunkerRevision,
    ...(scope === 'DOCUMENT_IDS' ? { documentIds: [...selectedDocumentIds] } : {}),
  } : null

  const submitCreate = async () => {
    if (!knowledgeBaseId || !createPayload || !canCreate) return
    setAdmissionConflictMessage(null)
    try {
      const result = await createPlan.mutateAsync({ knowledgeBaseId, payload: createPayload })
      await queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', knowledgeBaseId] })
      onPlanIdChange(result.planId)
      setAllConfirmationOpen(false)
      setConfirmationFingerprint(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setAdmissionConflictMessage('The migration target or destructive-plan admission changed before creation. Your scope draft was preserved; review the refreshed preview and confirm again.')
        setAllConfirmationOpen(false)
        setConfirmationFingerprint(null)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['chunk-migrations', knowledgeBaseId, 'preview'] }),
          queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', knowledgeBaseId] }),
        ])
        await preview.refetch()
      }
    }
  }

  const openCreate = () => {
    if (!canCreate) return
    if (scope === 'ALL') {
      setConfirmationFingerprint(previewIdentity)
      setAllConfirmationOpen(true)
      return
    }
    void submitCreate()
  }

  const retryable = Boolean(
    selectedPlan
    && TERMINAL_PLAN_STATUSES.includes(selectedPlan.status)
    && (selectedPlanSummary?.retryable ?? selectedPlan.retryable ?? selectedPlan.items.content.some((item) => item.retryable))
    && unresolvedCount(selectedPlan) > 0,
  )

  const submitRetry = async () => {
    if (!knowledgeBaseId || !selectedPlan || !retryable) return
    const result = await retryPlan.mutateAsync({ knowledgeBaseId, planId: selectedPlan.id, payload: { mode: 'RESNAPSHOT_UNRESOLVED' } })
    await queryClient.invalidateQueries({ queryKey: ['reprocessing-plans', knowledgeBaseId] })
    if (result.planId) onPlanIdChange(result.planId)
    setRetryConfirmationOpen(false)
  }

  const topSection = (
    <div className='stack-lg'>
      <OperationSpine
        ariaLabel='Chunk migration status'
        items={[
          { eyebrow: 'Scope', title: activeKb ?? knowledgeBaseId ?? 'None selected', body: 'Every migration is owned by the selected knowledge base.' },
          { eyebrow: 'Admission', title: preview.isLoading ? 'Previewing' : preview.data?.ready ? 'Ready' : 'Waiting', body: 'Preview is the only creation-readiness authority.' },
          { eyebrow: 'History', title: history.isLoading ? 'Loading' : `${history.data?.totalElements ?? 0} migrations`, body: 'Server-filtered migration audit history' },
          { eyebrow: 'Plan', title: selectedPlan?.status ?? 'None selected', body: selectedPlan ? `${selectedPlan.succeededDocuments}/${selectedPlan.totalDocuments} succeeded` : 'Choose a plan or use a deep link' },
        ]}
      />
      {!knowledgeBaseId ? <EmptyState title='Select a knowledge base' description='Chunk migration previews and plans are scoped to one selected knowledge base.' /> : null}
      {ownershipNotice ? <Alert title='Migration context cleared' message={ownershipNotice} tone='info' /> : null}
      {admissionConflictMessage ? <Alert title='Fresh preview required' message={admissionConflictMessage} tone='info' /> : null}
      <ScopeDraft
        scope={scope}
        selectedDocumentIds={selectedDocumentIds}
        ownedDocuments={ownedDocuments}
        invalidSelectedDocumentIds={invalidSelectedDocumentIds}
        includeOptions={includeOptions}
        processingOptions={processingOptions}
        optionDraft={effectiveOptionDraft}
        documentsLoading={documents.isLoading}
        onScopeChange={(nextScope) => {
          setScope(nextScope)
          setPreviewPage(0)
          setAdmissionConflictMessage(null)
        }}
        onSelectedDocumentChange={updateSelectedDocument}
        onSelectedDocumentIdsTextChange={setSelectedIdsFromText}
        onIncludeOptionsChange={(value) => {
          setIncludeOptions(value)
          setAdmissionConflictMessage(null)
        }}
        onOptionDraftChange={(key, value) => {
          setOptionDraftDocumentId(optionsDocumentId)
          setOptionDraft((current) => ({ ...(optionDraftDocumentId === optionsDocumentId ? current : effectiveOptionDraft), [key]: value }))
        }}
      />
      <PreviewPanel
        preview={preview.data}
        matchesDraft={previewMatchesDraft}
        isLoading={preview.isLoading || preview.isFetching}
        error={preview.error}
        page={previewPage}
        onPage={setPreviewPage}
        scope={scope}
      />
      <section className='panel stack' aria-labelledby='migration-create-heading'>
        <div><h3 id='migration-create-heading'>3. Create migration plan</h3><p>Creation copies only the current preview target and scope. Preview does not create work.</p></div>
        <div className='button-row'>
          <StatusBadge label={canCreate ? 'Preview matches draft' : 'Preview required'} tone={canCreate ? 'success' : 'warning'} />
          {preview.data?.target?.expectedChunkerRevision ? <StatusBadge label={`Revision ${preview.data.target.expectedChunkerRevision}`} /> : null}
        </div>
        <Button variant='primary' disabled={!canCreate || createPlan.isPending} isPending={createPlan.isPending} pendingText='Creating...' onClick={openCreate}>
          {scope === 'ALL' ? 'Review forced-all creation' : 'Create migration plan'}
        </Button>
        {createPlan.error && !(createPlan.error instanceof ApiError && createPlan.error.status === 409) ? <Alert title='Migration creation failed' message={message(createPlan.error)} /> : null}
      </section>
      <PlanDetailPanel
        plan={selectedPlan}
        summary={selectedPlanSummary}
        queryError={plan.error}
        isLoading={plan.isLoading}
        page={itemPage}
        onPage={setItemPage}
        retryable={retryable}
        retryPending={retryPlan.isPending}
        onRetry={() => setRetryConfirmationOpen(true)}
      />
      <HistoryPanel
        history={history.data}
        error={history.error}
        isLoading={history.isLoading}
        selection={historySelection}
        status={historyStatus}
        onSelectionChange={(value) => {
          setHistorySelection(value as ChunkReprocessingSelection | '')
          setHistoryPage(0)
        }}
        onStatusChange={(value) => {
          setHistoryStatus(value as ReprocessingPlanStatus | '')
          setHistoryPage(0)
        }}
        page={historyPage}
        onPage={setHistoryPage}
        onSelect={(nextPlanId) => {
          setItemPage(0)
          onPlanIdChange(nextPlanId)
        }}
      />
      {allConfirmationOpen ? <ConfirmationDialog
        title='Confirm forced-all migration'
        confirmLabel='Confirm and create migration'
        disabled={!canCreate || confirmationFingerprint !== previewIdentity || createPlan.isPending}
        onCancel={() => {
          setAllConfirmationOpen(false)
          setConfirmationFingerprint(null)
        }}
        onConfirm={() => void submitCreate()}
      >
        <p>This rebuilds current documents as well as documents with missing or outdated chunks.</p>
        <PreviewIdentitySummary preview={preview.data} scope={scope} />
        {confirmationFingerprint !== previewIdentity ? <Alert title='Confirmation expired' message='The preview or migration draft changed. Close this dialog, wait for a matching preview, and confirm again.' tone='info' /> : null}
      </ConfirmationDialog> : null}
      {retryConfirmationOpen && selectedPlan ? <ConfirmationDialog
        title='Retry unresolved migration work'
        confirmLabel='Confirm retry'
        disabled={retryPlan.isPending || !retryable}
        onCancel={() => setRetryConfirmationOpen(false)}
        onConfirm={() => void submitRetry()}
      >
        <p>Prior successful items remain in the audit history. Only unresolved documents will be resnapshotted under the current chunking, profile, embedding, and schema target.</p>
        <p><strong>Source plan:</strong> {selectedPlan.id} · {unresolvedCount(selectedPlan)} unresolved document(s)</p>
        {retryPlan.error ? <Alert title='Retry failed' message={message(retryPlan.error)} /> : null}
      </ConfirmationDialog> : null}
    </div>
  )

  return (
    <ControllerPage
      title='Chunking'
      eyebrow='Knowledge-base operations workspace'
      description='Preview, admit, monitor, and audit chunk-strategy migrations without changing documents implicitly.'
      workspaceStrip={<WorkspaceStrip items={[{ label: 'Scope', value: activeKb ?? knowledgeBaseId ?? 'None selected' }, { label: 'Authority', value: '/api/v1/knowledge-bases/{id}/chunk-migrations/preview' }]} />}
      topSectionTitle='Reprocessing'
      topSectionDescription='Outdated-strategy work is the primary path. Selected documents and forced-all rebuilds stay behind advanced scope controls.'
      topSectionStatus={<StatusBadge label={knowledgeBaseId ? 'Knowledge-base scoped' : 'Select a knowledge base'} tone={knowledgeBaseId ? 'success' : 'warning'} />}
      topSection={topSection}
      tabs={tabs}
      tabsTitle='Chunking workspace'
      tabsDescription='Strategy is global; Explorer and Reprocessing are knowledge-base scoped.'
      testId='chunking-reprocessing-page'
    />
  )
}

function ScopeDraft({
  scope,
  selectedDocumentIds,
  ownedDocuments,
  invalidSelectedDocumentIds,
  includeOptions,
  processingOptions,
  optionDraft,
  documentsLoading,
  onScopeChange,
  onSelectedDocumentChange,
  onSelectedDocumentIdsTextChange,
  onIncludeOptionsChange,
  onOptionDraftChange,
}: {
  scope: ChunkReprocessingSelection
  selectedDocumentIds: string[]
  ownedDocuments: DocumentUpload[]
  invalidSelectedDocumentIds: string[]
  includeOptions: boolean
  processingOptions: ReturnType<typeof useDocumentProcessingOptionsQuery>
  optionDraft: ProcessingOptionDraft
  documentsLoading: boolean
  onScopeChange: (scope: ChunkReprocessingSelection) => void
  onSelectedDocumentChange: (documentId: string, checked: boolean) => void
  onSelectedDocumentIdsTextChange: (value: string) => void
  onIncludeOptionsChange: (value: boolean) => void
  onOptionDraftChange: (key: string, value: boolean | string) => void
}) {
  return (
    <section className='panel stack' aria-labelledby='migration-scope-heading'>
      <div><h3 id='migration-scope-heading'>1. Migration scope</h3><p>Choose what should be admitted after a current, side-effect-free preview.</p></div>
      <fieldset className='stack'>
        <legend>Primary scope</legend>
        <label className='choice-label'><input type='radio' name='migration-scope' checked={scope === 'OUTDATED_STRATEGY'} onChange={() => onScopeChange('OUTDATED_STRATEGY')} /> Outdated strategy only <small>Recommended: rebuild documents with missing or stale chunks.</small></label>
      </fieldset>
      <details>
        <summary>Advanced scopes</summary>
        <div className='stack'>
          <label className='choice-label'><input type='radio' name='migration-scope' checked={scope === 'DOCUMENT_IDS'} onChange={() => onScopeChange('DOCUMENT_IDS')} /> Selected documents</label>
          <label className='choice-label'><input type='radio' name='migration-scope' checked={scope === 'ALL'} onChange={() => onScopeChange('ALL')} /> All documents <small>Forced rebuild, including current documents.</small></label>
          {scope === 'DOCUMENT_IDS' ? <>
            <label htmlFor='selected-document-ids'>Selected document IDs</label>
            <textarea id='selected-document-ids' aria-label='Selected document IDs' rows={3} value={selectedDocumentIds.join('\n')} onChange={(event) => onSelectedDocumentIdsTextChange(event.target.value)} placeholder='One document ID per line' />
            {documentsLoading ? <p>Loading documents owned by this knowledge base...</p> : ownedDocuments.length === 0 ? <EmptyState title='No documents available' description='Upload a document before selecting document IDs.' /> : <div className='stack'>
              {ownedDocuments.map((document) => <label className='choice-label' key={document.id}><input type='checkbox' aria-label={`Select ${document.originalFilename}`} checked={selectedDocumentIds.includes(document.id)} onChange={(event) => onSelectedDocumentChange(document.id, event.target.checked)} /> {document.originalFilename} <small>{document.id}</small></label>)}
            </div>}
            {invalidSelectedDocumentIds.length ? <Alert title='Selected document IDs are not owned by this knowledge base' message={invalidSelectedDocumentIds.join(', ')} /> : null}
          </> : null}
        </div>
      </details>
      <label className='choice-label'><input type='checkbox' checked={includeOptions} onChange={(event) => onIncludeOptionsChange(event.target.checked)} /> Override document processing options</label>
      {includeOptions ? processingOptions.isPending ? <p>Loading processing-option definitions...</p> : processingOptions.error ? <Alert title='Processing options unavailable' message={message(processingOptions.error)} /> : processingOptions.data ? <ProcessingOptionsEditor data={processingOptions.data} draft={optionDraft} onDraftChange={onOptionDraftChange} /> : <p>Select an owned document to load processing-option definitions.</p> : null}
    </section>
  )
}

function PreviewPanel({
  preview,
  matchesDraft,
  isLoading,
  error,
  page,
  onPage,
  scope,
}: {
  preview: ChunkMigrationPreview | undefined
  matchesDraft: boolean
  isLoading: boolean
  error: unknown
  page: number
  onPage: (page: number) => void
  scope: ChunkReprocessingSelection
}) {
  return (
    <section className='panel stack' aria-labelledby='migration-preview-heading'>
      <div><h3 id='migration-preview-heading'>2. Migration preview</h3><p>The backend preview explains readiness and selection. It never creates a plan or processing work.</p></div>
      {isLoading ? <p>Loading migration preview...</p> : null}
      {error ? <Alert title='Migration preview failed' message={message(error)} /> : null}
      {preview && !matchesDraft ? <Alert title='Preview is stale' message='A scope, document, option, or page input changed. Wait for a preview matching the current draft before creating a plan.' tone='info' /> : null}
      {!preview && !isLoading && !error && scope === 'DOCUMENT_IDS' ? <Alert title='No documents selected' message='Select at least one document owned by this knowledge base to request a selected-document preview.' tone='info' /> : null}
      {preview ? <>
        {preview.ready ? <Alert title='Migration preview ready' message='The backend target passed admission checks. Creation is still gated on a matching preview with selected work.' tone='success' /> : <Alert title='Migration preview blocked' message='Plan creation remains disabled until the backend blockers are resolved.' tone='info' />}
        {preview.blockers.map((blocker) => <Alert key={`${blocker.code}:${blocker.message}`} title={`${BLOCKER_LABELS[blocker.code] ?? 'Backend blocker'} · ${blocker.code}`} message={blocker.message} />)}
        {preview.target ? <PreviewIdentitySummary preview={preview} scope={scope} /> : <Alert title='No migration target' message='The backend did not return a valid target revision, so creation remains disabled.' />}
        <div className='grid three'>
          <Metric label='No chunks' value={String(preview.classificationCounts.noChunks)} />
          <Metric label='Outdated' value={String(preview.classificationCounts.outdated)} />
          <Metric label='Current' value={String(preview.classificationCounts.current)} />
          <Metric label='Selected count' value={String(preview.selectedCount)} />
          <Metric label='Selected page' value={`${preview.selectedDocuments.content.length} shown`} />
          <Metric label='Selection' value={preview.selection} />
        </div>
        {preview.selectedCount === 0 ? <Alert title='No selected migration work' message='This scope currently selects no documents. Creation remains disabled.' tone='info' /> : null}
        {preview.selectedDocuments.content.length ? <Table ariaLabel='Selected document classifications' headers={['Document', 'Classification', 'Chunker revision', 'Uploaded']} rows={preview.selectedDocuments.content.map((document) => [
          <span>{document.originalFilename}<small className='block'>{document.id}</small></span>,
          document.classification,
          document.effectiveChunkerRevision ?? 'None',
          formatDate(document.uploadedAt),
        ])} rowKeys={preview.selectedDocuments.content.map((document) => document.id)} /> : <EmptyState title='No selected document classifications on this page' description='The server returned no document rows for this preview page.' />}
        <Pager page={page} size={preview.selectedDocuments.size} total={preview.selectedDocuments.totalElements} onPage={onPage} />
      </> : null}
    </section>
  )
}

function HistoryPanel({
  history,
  error,
  isLoading,
  selection,
  status,
  onSelectionChange,
  onStatusChange,
  page,
  onPage,
  onSelect,
}: {
  history: { content: ReprocessingPlanSummary[]; size: number; totalElements: number } | undefined
  error: unknown
  isLoading: boolean
  selection: string
  status: string
  onSelectionChange: (value: string) => void
  onStatusChange: (value: string) => void
  page: number
  onPage: (page: number) => void
  onSelect: (planId: string) => void
}) {
  return (
    <section className='panel stack' aria-labelledby='migration-history-heading'>
      <div><h3 id='migration-history-heading'>Migration history</h3><p>Newest-first history is filtered by the server to chunk-strategy migrations.</p></div>
      <div className='button-row'>
        <label>Selection <select aria-label='Migration selection filter' value={selection} onChange={(event) => onSelectionChange(event.target.value)}><option value=''>All scopes</option><option value='OUTDATED_STRATEGY'>OUTDATED_STRATEGY</option><option value='DOCUMENT_IDS'>DOCUMENT_IDS</option><option value='ALL'>ALL</option></select></label>
        <label>Status <select aria-label='Migration status filter' value={status} onChange={(event) => onStatusChange(event.target.value)}><option value=''>All statuses</option>{['QUEUED', 'RUNNING', 'BLOCKED', 'COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      {isLoading ? <p>Loading migration history...</p> : null}
      {error ? <Alert title='Migration history unavailable' message={message(error)} /> : null}
      {history?.content.length ? <Table ariaLabel='Chunk migration history' headers={['Plan', 'Reason', 'Selection', 'Target revision', 'Status / progress', 'Target', 'Retry / lineage', 'Created']} rows={history.content.map((item) => [
        <button className='link-button' type='button' onClick={() => onSelect(item.id)}>{item.id}</button>,
        item.reason,
        item.selection ?? '—',
        item.expectedChunkerRevision ?? '—',
        <span><StatusBadge label={item.status} tone={item.status === 'COMPLETED' ? 'success' : item.status === 'FAILED' || item.status === 'BLOCKED' ? 'error' : 'warning'} /><small className='block'>{progressLabel(item)}</small></span>,
        item.targetCurrent ? 'Current' : 'Changed',
        <span>{item.retryable ? 'Retryable' : 'Not retryable'}<small className='block'>{item.retryOfPlanId ? `Retry of ${item.retryOfPlanId}` : 'Original plan'}</small></span>,
        formatDate(item.createdAt),
      ])} rowKeys={history.content.map((item) => item.id)} /> : !isLoading && !error ? <EmptyState title='No migration history' description='Created chunk-strategy migration plans will appear here.' /> : null}
      <Pager page={page} size={history?.size ?? PAGE_SIZE} total={history?.totalElements ?? 0} onPage={onPage} />
    </section>
  )
}

function PlanDetailPanel({
  plan,
  summary,
  queryError,
  isLoading,
  page,
  onPage,
  retryable,
  retryPending,
  onRetry,
}: {
  plan: ReprocessingPlanDetail | null
  summary: ReprocessingPlanSummary | null
  queryError: unknown
  isLoading: boolean
  page: number
  onPage: (page: number) => void
  retryable: boolean
  retryPending: boolean
  onRetry: () => void
}) {
  return (
    <section className='panel stack' aria-labelledby='migration-plan-heading'>
      <div><h3 id='migration-plan-heading'>Selected migration plan</h3><p>Active plans poll until terminal status; their nested items remain server-paged.</p></div>
      {!plan && !isLoading && !queryError ? <EmptyState title='No migration plan selected' description='Select a history row or open a reload-safe plan link.' /> : null}
      {isLoading ? <p>Loading selected migration plan...</p> : null}
      {queryError ? <Alert title='Could not load selected migration plan' message={message(queryError)} /> : null}
      {plan ? <>
        <div className='grid three'>
          <Metric label='Plan' value={`${plan.id} · ${plan.status}`} />
          <Metric label='Reason / selection' value={`${plan.reason} · ${plan.selection ?? '—'}`} />
          <Metric label='Progress' value={progressLabel(plan)} />
          <Metric label='Target revision' value={plan.expectedChunkerRevision ?? '—'} />
          <Metric label='Target schema' value={`${plan.schemaId ?? '—'} · ${plan.schemaContentHash ?? '—'}`} />
          <Metric label='AI profile / revision' value={`${plan.aiProfileId ?? '—'} · ${plan.aiProfileRevision ?? '—'}`} />
          <Metric label='Target currency' value={summary ? (summary.targetCurrent ? 'Current' : 'Changed') : plan.targetCurrent === undefined ? 'Unknown' : plan.targetCurrent ? 'Current' : 'Changed'} />
          <Metric label='Created' value={formatDate(plan.createdAt)} />
          <Metric label='Lineage' value={plan.retryOfPlanId ? `Retry of ${plan.retryOfPlanId}` : 'Original plan'} />
        </div>
        {plan.retryOfPlanId ? <Alert title='Retry lineage preserved' message={`This plan resnapshots unresolved work from ${plan.retryOfPlanId}; successful items remain part of the prior audit context.`} tone='info' /> : null}
        {plan.items.content.map((item) => <PlanItemExplanation key={`${item.id}:${item.status}`} item={item} />)}
        {plan.items.content.length ? <Table ariaLabel='Migration plan items' headers={['Document', 'Status', 'Failure / blocker', 'Prior item', 'Completed']} rows={plan.items.content.map((item) => [item.documentId, item.status, item.failureCategory ?? '—', item.priorItemId ?? 'Original item', formatDate(item.completedAt)])} rowKeys={plan.items.content.map((item) => item.id)} /> : <EmptyState title='No items on this page' description='The plan has no item rows on the current server page.' />}
        <Pager page={page} size={plan.items.size} total={plan.items.totalElements} onPage={onPage} />
        {retryable ? <Button disabled={retryPending} isPending={retryPending} onClick={onRetry}>Retry unresolved work</Button> : null}
      </> : null}
    </section>
  )
}

function PlanItemExplanation({ item }: { item: ReprocessingPlanItem }) {
  if (item.status === 'STALE_SOURCE') return <Alert title={`Stale source · ${item.documentId}`} message='The source document changed after the snapshot and was not processed under the stale snapshot.' tone='info' />
  if (item.status === 'BLOCKED') return <Alert title={`Blocked · ${item.documentId}`} message={item.failureCategory ? `Backend safety blocker: ${item.failureCategory}` : 'The backend stopped this item for a safety blocker; this is distinct from a processing failure.'} tone='info' />
  if (item.status === 'BLOCKED_TARGET_CHANGED') return <Alert title={`Target changed · ${item.documentId}`} message='The snapshotted chunk, profile, embedding, or schema target changed before processing. Successful items remain preserved.' tone='info' />
  return null
}

function ConfirmationDialog({
  title,
  confirmLabel,
  disabled,
  onCancel,
  onConfirm,
  children,
}: {
  title: string
  confirmLabel: string
  disabled: boolean
  onCancel: () => void
  onConfirm: () => void
  children: ReactNode
}) {
  return <div className='notice' role='dialog' aria-modal='true' aria-labelledby='migration-dialog-title'><div className='stack'><h2 id='migration-dialog-title'>{title}</h2>{children}<div className='button-row'><Button variant='ghost' onClick={onCancel}>Cancel</Button><Button variant='primary' disabled={disabled} onClick={onConfirm}>{confirmLabel}</Button></div></div></div>
}

function PreviewIdentitySummary({ preview, scope }: { preview: ChunkMigrationPreview | undefined; scope: ChunkReprocessingSelection }) {
  if (!preview?.target) return null
  return <div className='grid three'><Metric label='Scope / selected' value={`${scope} · ${preview.selectedCount}`} /><Metric label='Classification totals' value={`no chunks ${preview.classificationCounts.noChunks} · outdated ${preview.classificationCounts.outdated} · current ${preview.classificationCounts.current}`} /><Metric label='Schema target' value={`${preview.target.schemaId ?? '—'} · ${preview.target.schemaContentHash ?? '—'}`} /><Metric label='AI profile target' value={`${preview.target.aiProfileId ?? '—'} · revision ${preview.target.aiProfileRevision}`} /><Metric label='Embedding space' value={preview.target.embeddingSpaceId ?? '—'} /><Metric label='Expected chunker revision' value={preview.target.expectedChunkerRevision ?? '—'} /></div>
}

function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (page: number) => void }) {
  return <div className='button-row'><Button variant='ghost' disabled={page === 0} onClick={() => onPage(Math.max(0, page - 1))}>Previous</Button><span>Page {page + 1} · {total} items total</span><Button variant='ghost' disabled={(page + 1) * size >= total} onClick={() => onPage(page + 1)}>Next</Button></div>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className='metric'><strong>{label}</strong><small>{value}</small></div>
}

function progressLabel(value: Pick<ReprocessingPlanDetail, 'succeededDocuments' | 'totalDocuments' | 'failedDocuments' | 'staleDocuments' | 'blockedDocuments'>) {
  return `${value.succeededDocuments}/${value.totalDocuments} succeeded · ${value.failedDocuments} failed · ${value.staleDocuments} stale · ${value.blockedDocuments} blocked`
}

function unresolvedCount(plan: Pick<ReprocessingPlanDetail, 'failedDocuments' | 'staleDocuments' | 'blockedDocuments'>) {
  return plan.failedDocuments + plan.staleDocuments + plan.blockedDocuments
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : '—'
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed'
}
