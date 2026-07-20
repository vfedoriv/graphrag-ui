import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useDocumentProcessingOptionsQuery, useDocumentsQuery } from '../../api/documents'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { queryKeys } from '../../api/queryKeys'
import {
  useEvaluationEligibilityQuery, useEvaluationHistoryQuery, useEvaluationQuery, usePlanHistoryQuery,
  usePlanQuery, usePublicationQuery, useReadinessQuery, useSchemaDraftReleaseMutations,
} from '../../api/schemaDraftRelease'
import { useActivateSchemaMutation } from '../../api/schemas'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import { ProcessingOptionsEditor } from '../documents/DocumentProcessingOptionsWorkflow'
import { buildProcessingOptionDraft, serializeMutableProcessingOptions, type ProcessingOptionDraft } from '../documents/processingOptions'
import type { DraftResponse } from './schemaDraftTypes'
import type { EvaluationMetrics } from './schemaDraftReleaseTypes'

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : '—'
const message = (error: unknown) => error instanceof Error ? error.message : 'Request failed'

export function SchemaDraftReleaseWorkflow({ draft }: { draft: DraftResponse }) {
  const queryClient = useQueryClient()
  const release = useSchemaDraftReleaseMutations()
  const activate = useActivateSchemaMutation()
  const knowledgeBases = useKnowledgeBasesQuery()
  const documents = useDocumentsQuery(draft.knowledgeBaseId)
  const activeSchemaId = knowledgeBases.data?.find((item) => item.id === draft.knowledgeBaseId)?.activeSchemaId ?? null

  const [eligibilityPage, setEligibilityPage] = useState(0)
  const [evaluationPage, setEvaluationPage] = useState(0)
  const [evaluationHistoryPage, setEvaluationHistoryPage] = useState(0)
  const eligibility = useEvaluationEligibilityQuery(draft.knowledgeBaseId, draft.id, eligibilityPage, 10)
  const evaluationHistory = useEvaluationHistoryQuery(draft.knowledgeBaseId, draft.id, evaluationHistoryPage, 10)
  const [runId, setRunId] = useState<string | null>(draft.latestEvaluation?.id ?? null)
  const evaluation = useEvaluationQuery(draft.knowledgeBaseId, draft.id, runId, evaluationPage, 10)
  const [selectedEvaluationDocuments, setSelectedEvaluationDocuments] = useState<string[]>([])
  const [advisoryEnabled, setAdvisoryEnabled] = useState(false)

  const readiness = useReadinessQuery(draft.knowledgeBaseId, draft.id, Boolean(draft.currentAggregateId && draft.status !== 'PUBLISHED'))
  const publication = usePublicationQuery(draft.knowledgeBaseId, draft.id, draft.status === 'PUBLISHED' || Boolean(draft.publicationSchemaId))

  const [planHistoryPage, setPlanHistoryPage] = useState(0)
  const [planItemPage, setPlanItemPage] = useState(0)
  const planHistory = usePlanHistoryQuery(draft.knowledgeBaseId, draft.id, planHistoryPage, 10)
  const [planId, setPlanId] = useState<string | null>(draft.latestReprocessing?.id ?? null)
  const plan = usePlanQuery(draft.knowledgeBaseId, planId, planItemPage, 10)
  const [allDocuments, setAllDocuments] = useState(true)
  const [selectedPlanDocuments, setSelectedPlanDocuments] = useState<string[]>([])
  const optionsDocumentId = selectedPlanDocuments[0] ?? documents.data?.[0]?.id ?? null
  const processingOptions = useDocumentProcessingOptionsQuery(optionsDocumentId)
  const [optionDraft, setOptionDraft] = useState<ProcessingOptionDraft>({})
  const [includeOptions, setIncludeOptions] = useState(false)
  const [resnapshot, setResnapshot] = useState(false)

  const effectiveOptionDraft = useMemo(() => Object.keys(optionDraft).length || !processingOptions.data ? optionDraft : buildProcessingOptionDraft(processingOptions.data.options), [optionDraft, processingOptions.data])
  useEffect(() => {
    if (!evaluation.data || evaluation.data.status === 'QUEUED' || evaluation.data.status === 'RUNNING') return
    void queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftReadiness(draft.knowledgeBaseId, draft.id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftEvaluationHistory(draft.knowledgeBaseId, draft.id, evaluationHistoryPage, 10) })
  }, [draft.id, draft.knowledgeBaseId, evaluation.data, evaluationHistoryPage, queryClient])
  useEffect(() => {
    if (!plan.data || plan.data.status === 'QUEUED' || plan.data.status === 'RUNNING') return
    void queryClient.invalidateQueries({ queryKey: queryKeys.documents(draft.knowledgeBaseId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.reprocessingPlanHistory(draft.knowledgeBaseId, draft.id, planHistoryPage, 10) })
  }, [draft.id, draft.knowledgeBaseId, plan.data, planHistoryPage, queryClient])

  const eligibilityStale = Boolean(eligibility.data && (eligibility.data.draftRevision !== draft.revision || eligibility.data.currentAggregateId !== draft.currentAggregateId))
  const hasCurrentAggregate = Boolean(draft.currentAggregateId)
  const publishedSchemaId = publication.data?.schemaId ?? draft.publicationSchemaId
  const publishedActive = Boolean(publishedSchemaId && activeSchemaId === publishedSchemaId)
  const selectedPlanSummary = planHistory.data?.content.find((item) => item.id === plan.data?.id)
  const publish = () => {
    if (!readiness.data || !window.confirm(`Publish ${readiness.data.targetName} v${readiness.data.targetVersion} as a new inactive schema? This will not activate or reprocess documents.`)) return
    release.publish.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, payload: { revision: readiness.data.draftRevision, projectionContentHash: readiness.data.projectionContentHash } })
  }
  const startEvaluation = () => {
    if (!eligibility.data || eligibilityStale || !selectedEvaluationDocuments.length) return
    if (!window.confirm(`Evaluate ${selectedEvaluationDocuments.length} held-out document(s) against draft revision ${eligibility.data.draftRevision}?`)) return
    release.startEvaluation.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, payload: { revision: eligibility.data.draftRevision, documentIds: selectedEvaluationDocuments, advisoryEnabled } }, { onSuccess: (result) => setRunId(result.runId) })
  }
  const createPlan = () => {
    if (!publishedSchemaId || !publishedActive || (!allDocuments && !selectedPlanDocuments.length)) return
    if (!window.confirm(`Create a separate reprocessing plan for ${allDocuments ? 'all eligible documents' : `${selectedPlanDocuments.length} selected document(s)`}?`)) return
    const options = includeOptions && processingOptions.data ? serializeMutableProcessingOptions(processingOptions.data.options, effectiveOptionDraft) : null
    release.createPlan.mutate({ knowledgeBaseId: draft.knowledgeBaseId, payload: { draftId: draft.id, schemaId: publishedSchemaId, allDocuments, documentIds: allDocuments ? null : selectedPlanDocuments, processingOptions: options } }, { onSuccess: (result) => setPlanId(result.planId) })
  }

  return <div className='stack-lg'>
    <Stage title='1. Held-out evaluation' description='Server-owned eligibility and durable results. Deterministic metrics remain separate from optional advisory judgments.'>
      {!hasCurrentAggregate ? <Alert tone='info' title='Current analysis required' message='Complete analysis and review to produce a current aggregate before starting held-out evaluation.' /> : null}
      {eligibility.error ? <Alert title='Could not load evaluation eligibility' message={message(eligibility.error)} /> : null}
      {eligibilityStale ? <><Alert tone='info' title='Eligibility snapshot is stale' message='The draft revision or current aggregate changed. Refresh eligibility before starting evaluation.' /><Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftEvaluationEligibility(draft.knowledgeBaseId, draft.id, eligibilityPage, 10) })}>Refresh eligibility</Button></> : null}
      {eligibility.data ? <>
        <div className='button-row'><StatusBadge label={`Draft revision ${eligibility.data.draftRevision}`} /><StatusBadge label={`Aggregate ${eligibility.data.currentAggregateId ?? 'none'}`} /></div>
        {eligibility.data.content.length ? <Table ariaLabel='Evaluation eligible documents' headers={['Select', 'Document', 'Snapshot', 'Eligibility']} rows={eligibility.data.content.map((item) => [
          <input aria-label={`Select ${item.filename}`} type='checkbox' disabled={!item.eligible || eligibilityStale || !hasCurrentAggregate} checked={selectedEvaluationDocuments.includes(item.documentId)} onChange={(event) => setSelectedEvaluationDocuments((current) => event.target.checked ? [...current, item.documentId] : current.filter((id) => id !== item.documentId))} />,
          <span>{item.filename}<small className='block'>{item.documentId} · {item.contentType} · {item.sizeBytes.toLocaleString()} bytes</small></span>,
          <span>{item.sha256}<small className='block'>{formatDate(item.uploadedAt)}</small></span>,
          item.eligible ? <StatusBadge label='Eligible' tone='success' /> : <span><StatusBadge label='Ineligible' tone='warning' /><small className='block'>Contributed active discovery evidence.</small></span>,
        ])} rowKeys={eligibility.data.content.map((item) => item.documentId)} /> : <EmptyState title='No held-out documents' description='Upload a separate document that did not contribute active discovery evidence.' />}
        <Pager page={eligibilityPage} size={eligibility.data.size} total={eligibility.data.totalElements} onPage={setEligibilityPage} />
      </> : null}
      <label className='choice-label'><input type='checkbox' checked={advisoryEnabled} onChange={(event) => setAdvisoryEnabled(event.target.checked)} /> Include advisory model assessment</label>
      <p className='text-xs'>Advisory question coverage and schema-noise judgments are model-generated and never replace deterministic validation.</p>
      <Button variant='primary' disabled={!selectedEvaluationDocuments.length || eligibilityStale || !hasCurrentAggregate} isPending={release.startEvaluation.isPending} onClick={startEvaluation}>Start held-out evaluation</Button>
      <RequestError error={release.startEvaluation.error ?? release.retryEvaluation.error} />
      {evaluation.error ? <Alert title='Could not load evaluation details' message={message(evaluation.error)} /> : null}
      {evaluation.data ? <EvaluationResult metrics={evaluation.data.metrics} advisory={evaluation.data.advisoryAssessment} run={evaluation.data} onRetry={() => { if (window.confirm(`Retry evaluation against current draft revision ${draft.revision}?`)) release.retryEvaluation.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, runId: evaluation.data.id, revision: draft.revision }, { onSuccess: (result) => setRunId(result.runId) }) }} /> : null}
      {evaluation.data ? <><Table headers={['Document', 'Status', 'Reuse', 'Chunks', 'Failure / evidence']} rows={evaluation.data.outcomes.content.map((item) => [item.documentId, item.status, item.reused ? 'Reused prior success' : 'New outcome', item.chunkCount, item.failureCategory ?? (item.evidenceCoordinates.join(', ') || '—')])} rowKeys={evaluation.data.outcomes.content.map((item) => item.id)} /><Pager page={evaluationPage} size={evaluation.data.outcomes.size} total={evaluation.data.outcomes.totalElements} onPage={setEvaluationPage} /></> : null}
      <h4>Evaluation history</h4>{evaluationHistory.data?.content.length ? <Table headers={['Run', 'Status', 'Current', 'Progress', 'Contract', 'Lineage', 'Created']} rows={evaluationHistory.data.content.map((item) => [<button className='link-button' type='button' onClick={() => setRunId(item.id)}>{item.id}</button>, item.status, item.current ? 'Current' : 'Stale audit result', `${item.succeededDocuments}/${item.totalDocuments}`, item.contractRevision, item.retryOfRunId ? `Retry of ${item.retryOfRunId}` : 'Original', formatDate(item.createdAt)])} rowKeys={evaluationHistory.data.content.map((item) => item.id)} /> : <p>No evaluation history.</p>}
      <Pager page={evaluationHistoryPage} size={evaluationHistory.data?.size ?? 10} total={evaluationHistory.data?.totalElements ?? 0} onPage={setEvaluationHistoryPage} />
    </Stage>

    <Stage title='2. Publication readiness and inactive publication' description='Readiness is a short-lived token bound to the exact draft revision and projection hash.'>
      {readiness.error && draft.status !== 'PUBLISHED' ? <Alert title='Could not load publication readiness' message={message(readiness.error)} /> : null}
      {readiness.data ? <><div className='grid three'><Metric label='Target' value={`${readiness.data.targetName} v${readiness.data.targetVersion}`} /><Metric label='Authority' value={`revision ${readiness.data.draftRevision} · ${readiness.data.aggregateRevisionId}`} /><Metric label='Projection hash' value={readiness.data.projectionContentHash} /></div>{readiness.data.blockingReasons.map((item) => <Alert key={item.id} tone='info' title={item.category} message={item.detail} />)}<Button variant='primary' disabled={!readiness.data.ready} isPending={release.publish.isPending} onClick={publish}>Publish inactive schema</Button></> : draft.status !== 'PUBLISHED' ? hasCurrentAggregate ? <p>Loading readiness…</p> : <Alert tone='info' title='Publication readiness unavailable' message='Complete analysis and review to produce a current aggregate before checking publication readiness.' /> : null}
      <RequestError error={release.publish.error} />
      {publication.data ? <PublicationAudit value={publication.data} /> : null}
    </Stage>

    <Stage title='3. Explicit activation' description='Activation is a separate confirmed operation. It does not create a reprocessing plan.'>
      {!publishedSchemaId ? <p>Publish the reviewed draft before activation.</p> : publishedActive ? <Alert tone='success' title='Published schema is active' message='The reprocessing stage is now available. No documents have been reprocessed automatically.' /> : <><Alert tone='info' title='Published schema is inactive' message={`Active schema: ${activeSchemaId ?? 'none'}. Publication did not activate it.`} /><Button isPending={activate.isPending} onClick={() => { if (window.confirm(`Activate published schema ${publishedSchemaId}? This still will not reprocess documents.`)) activate.mutate({ knowledgeBaseId: draft.knowledgeBaseId, schemaId: publishedSchemaId }, { onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraft(draft.knowledgeBaseId, draft.id) }), queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftPublication(draft.knowledgeBaseId, draft.id) }), queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftReadiness(draft.knowledgeBaseId, draft.id) })]) } }) }}>Activate published schema</Button></>}
      <RequestError error={activate.error} />
      {publishedSchemaId ? <div className='button-row'><Link className='button' to='/schemas'>Open Schemas</Link><Link className='button' to={`/schema-builder?schemaId=${encodeURIComponent(publishedSchemaId)}`}>Open in Schema Builder</Link></div> : null}
      {publication.data?.contentDrifted ? <Alert tone='info' title='Publication content drift' message='The registered schema was edited and no longer matches the reviewed publication snapshot. Inspect it before activation or reprocessing.' /> : null}
    </Stage>

    <Stage title='4. Explicit reprocessing plan' description='Create a bounded plan only while this published schema is active. Scope and retry snapshot behavior are explicit.'>
      {!publishedActive ? <Alert tone='info' title='Activation required' message='Plan creation is blocked until the published schema is the active schema for this knowledge base.' /> : <>
        <div className='button-row'><label className='choice-label'><input type='radio' checked={allDocuments} onChange={() => setAllDocuments(true)} /> All eligible documents</label><label className='choice-label'><input type='radio' checked={!allDocuments} onChange={() => setAllDocuments(false)} /> Explicit documents</label></div>
        {!allDocuments ? <div className='stack'>{documents.data?.map((item) => <label className='choice-label' key={item.id}><input type='checkbox' checked={selectedPlanDocuments.includes(item.id)} onChange={(event) => setSelectedPlanDocuments((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /> {item.originalFilename} ({item.id})</label>)}</div> : null}
        <label className='choice-label'><input type='checkbox' checked={includeOptions} onChange={(event) => setIncludeOptions(event.target.checked)} /> Override processing options</label>
        {includeOptions ? processingOptions.isPending ? <p>Loading processing options…</p> : processingOptions.error ? <Alert title='Could not load processing options' message={message(processingOptions.error)} /> : processingOptions.data ? <ProcessingOptionsEditor data={processingOptions.data} draft={effectiveOptionDraft} onDraftChange={(key, value) => setOptionDraft((current) => ({ ...(Object.keys(current).length ? current : buildProcessingOptionDraft(processingOptions.data.options)), [key]: value }))} /> : <p>Select a document to load supported processing options.</p> : null}
        <Button variant='primary' disabled={!allDocuments && !selectedPlanDocuments.length} isPending={release.createPlan.isPending} onClick={createPlan}>Create reprocessing plan</Button>
      </>}
      <RequestError error={release.createPlan.error ?? release.retryPlan.error} />
      {plan.data ? <><div className='grid three'><Metric label='Plan' value={`${plan.data.status} · ${plan.data.id}`} /><Metric label='Progress' value={`${plan.data.succeededDocuments}/${plan.data.totalDocuments} succeeded`} /><Metric label='Unresolved' value={`${plan.data.failedDocuments} failed · ${plan.data.staleDocuments} stale · ${plan.data.blockedDocuments} blocked`} /></div>{plan.data.items.content.map((item) => item.status === 'BLOCKED' ? <Alert key={item.id} tone='info' title={`Blocked: ${item.documentId}`} message='The target schema is no longer active; this is a safety stop, not a processing failure.' /> : item.status === 'STALE_SOURCE' ? <Alert key={item.id} tone='info' title={`Changed document: ${item.documentId}`} message='The document changed after the plan snapshot and was not processed under the old content.' /> : null)}<Table headers={['Document', 'Status', 'Failure', 'Prior item', 'Completed']} rows={plan.data.items.content.map((item) => [item.documentId, item.status, item.failureCategory ?? '—', item.priorItemId ?? 'Original item', formatDate(item.completedAt)])} rowKeys={plan.data.items.content.map((item) => item.id)} /><Pager page={planItemPage} size={plan.data.items.size} total={plan.data.items.totalElements} onPage={setPlanItemPage} />{['COMPLETED', 'PARTIAL', 'FAILED', 'INTERRUPTED'].includes(plan.data.status) && selectedPlanSummary?.retryable ? <><label className='choice-label'><input type='checkbox' checked={resnapshot} onChange={(event) => setResnapshot(event.target.checked)} /> Resnapshot unresolved documents that changed</label><p className='text-xs'>{resnapshot ? 'Changed unresolved documents may be retried using their current content.' : 'Changed snapshots remain unresolved; prior successes remain historical and are not rerun.'}</p><Button onClick={() => { if (window.confirm(`Retry unresolved plan work with resnapshot ${resnapshot ? 'enabled' : 'disabled'}?`)) release.retryPlan.mutate({ knowledgeBaseId: draft.knowledgeBaseId, planId: plan.data.id, payload: { resnapshotUnresolvedDocuments: resnapshot } }, { onSuccess: (result) => setPlanId(result.planId) }) }}>Retry unresolved work</Button></> : null}</> : null}
      <h4>Reprocessing history</h4>{planHistory.data?.content.length ? <Table headers={['Plan', 'Status', 'Latest', 'Target', 'Progress', 'Retry lineage', 'Created']} rows={planHistory.data.content.map((item) => [<button className='link-button' type='button' onClick={() => setPlanId(item.id)}>{item.id}</button>, item.status, item.latest ? 'Latest' : 'Historical', item.targetCurrent ? 'Target current' : 'Target no longer current', `${item.succeededDocuments}/${item.totalDocuments}`, item.retryOfPlanId ? `Retry of ${item.retryOfPlanId}` : 'Original', formatDate(item.createdAt)])} rowKeys={planHistory.data.content.map((item) => item.id)} /> : <p>No reprocessing history.</p>}
      <Pager page={planHistoryPage} size={planHistory.data?.size ?? 10} total={planHistory.data?.totalElements ?? 0} onPage={setPlanHistoryPage} />
    </Stage>
  </div>
}

function Stage({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <section className='panel stack'><div><h3>{title}</h3><p>{description}</p></div>{children}</section> }
function Metric({ label, value }: { label: string; value: string }) { return <div className='metric'><strong>{label}</strong><small>{value}</small></div> }
function RequestError({ error }: { error: unknown }) { return error ? <Alert title='Release operation failed' message={message(error)} /> : null }
function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (page: number) => void }) { return <div className='button-row'><Button variant='ghost' disabled={page === 0} onClick={() => onPage(Math.max(0, page - 1))}>Previous</Button><span>Page {page + 1} · {total} items total</span><Button variant='ghost' disabled={(page + 1) * size >= total} onClick={() => onPage(page + 1)}>Next</Button></div> }
function PublicationAudit({ value }: { value: NonNullable<ReturnType<typeof usePublicationQuery>['data']> }) { return <div className='stack'><Alert tone={value.contentDrifted ? 'info' : 'success'} title={value.contentDrifted ? 'Published schema has drifted' : 'Publication audit record'} message={value.contentDrifted ? 'The live registered-schema hash differs from the immutable publication hash.' : 'The live schema still matches the reviewed publication snapshot.'} /><div className='grid three'><Metric label='Publication / schema' value={`${value.publicationId} · ${value.schemaId}`} /><Metric label='Published authority' value={`revision ${value.draftRevision} · ${value.publicationContentHash}`} /><Metric label='Live state' value={`${value.active ? 'Active' : 'Inactive'} · ${value.currentSchemaContentHash} · ${formatDate(value.publishedAt)}`} /></div></div> }
function EvaluationResult({ metrics, advisory, run, onRetry }: { metrics: EvaluationMetrics; advisory: NonNullable<ReturnType<typeof useEvaluationQuery>['data']>['advisoryAssessment']; run: NonNullable<ReturnType<typeof useEvaluationQuery>['data']>; onRetry: () => void }) {
  const legacy = run.contractRevision === 'schema-draft-evaluation-v1'
  return <div className='stack'><div className='button-row'><StatusBadge label={run.status} tone={run.status === 'COMPLETED' ? 'success' : run.status === 'PARTIAL' ? 'warning' : 'neutral'} /><StatusBadge label={`${run.succeededDocuments}/${run.totalDocuments} succeeded`} /><StatusBadge label={run.retryOfRunId ? `Retry of ${run.retryOfRunId}` : 'Original run'} /></div>{legacy ? <Alert tone='info' title='Legacy evaluation result' message='Version-one empty reason or evidence collections mean historical detail was not persisted; they do not prove absence.' /> : null}<h4>Deterministic metrics</h4><Table headers={['Metric', 'Formula / count', 'Value', 'Evidence']} rows={[...metrics.rates.map((item) => [item.metric, `${item.numerator} / ${item.denominator}`, item.applicability === 'NOT_APPLICABLE' ? 'Not applicable' : item.value?.toLocaleString() ?? '—', item.evidence.map((entry) => entry.coordinate).join(', ') || 'No coordinates']), ...metrics.counts.map((item) => [item.metric, item.count, 'Count', item.evidence.map((entry) => entry.coordinate).join(', ') || 'No coordinates'])]} />{metrics.reasons.map((item) => <Alert key={`${item.code}:${item.detail}`} tone='info' title={item.code} message={item.detail} />)}<h4>Advisory model assessment</h4><StatusBadge label={advisory.status} tone={advisory.status === 'COMPLETED' ? 'success' : 'warning'} />{advisory.status === 'COMPLETED' ? <><Table headers={['Question fingerprint', 'Coverage', 'Reasons', 'Coordinates']} rows={advisory.intendedQuestions.map((item) => [item.questionFingerprint, item.coverage, item.reasons.map((reason) => `${reason.code}: ${reason.detail}`).join('; ') || '—', item.schemaCoordinates.join(', ') || '—'])} /><Table headers={['Schema coordinate', 'Assessment', 'Reasons']} rows={advisory.schemaNoise.map((item) => [item.schemaCoordinate, item.assessment, item.reasons.map((reason) => `${reason.code}: ${reason.detail}`).join('; ') || '—'])} /></> : <p>{advisory.status === 'NOT_REQUESTED' ? 'Advisory assessment was not requested.' : advisory.status === 'COMPLETED_WITHOUT_MODEL_JUDGMENT' ? 'Execution completed without a model judgment.' : 'Advisory execution failed; deterministic results remain valid.'}</p>}{advisory.reasons.map((item) => <p key={`${item.code}:${item.detail}`}>{item.code}: {item.detail}</p>)}{advisory.warnings.map((item) => <Alert key={item} tone='info' title='Advisory warning' message={item} />)}<p className='text-xs'>Reproducibility: profile {advisory.reproducibility.profileId} revision {advisory.reproducibility.profileRevision} · prompt {advisory.reproducibility.promptRevision} · contract {advisory.reproducibility.contractRevision}</p>{run.retryable ? <Button onClick={onRetry}>Retry evaluation</Button> : null}</div>
}
