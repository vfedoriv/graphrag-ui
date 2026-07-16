import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../api/types'
import { useDocumentsQuery } from '../../api/documents'
import { queryKeys } from '../../api/queryKeys'
import { useSchemasByKnowledgeBaseQuery } from '../../api/schemas'
import {
  schemaDraftsApi,
  useCreateSchemaDraftMutation,
  useSchemaDraftAnalysisHistoryQuery,
  useSchemaDraftAnalysisRunQuery,
  useSchemaDraftCandidatesQuery,
  useSchemaDraftQuery,
  useSchemaDraftReviewQueries,
  useSchemaDraftSourcesQuery,
  useSchemaDraftWorkflowMutations,
  useSchemaDraftsQuery,
  useUpdateSchemaDraftGuidanceMutation,
  useUpdateSchemaDraftMutation,
} from '../../api/schemaDrafts'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { Input } from '../../shared/ui/Input'
import { WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { Textarea } from '../../shared/ui/Textarea'
import type { Compatibility, DraftGuidance, DraftResponse } from './schemaDraftTypes'
import { emptyDraftGuidance, isTerminalAnalysisStatus } from './schemaDraftTypes'
import { SchemaDraftReleaseWorkflow } from './SchemaDraftReleaseWorkflow'
import { CandidateReviewItem } from './CandidateReviewItem'

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : '—'
const formatJson = (value: unknown) => JSON.stringify(value, null, 2)
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Request failed'
const isConflict = (error: unknown) => error instanceof ApiError && error.status === 409

function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return <Alert title={isConflict(error) ? 'Draft changed on the server' : 'Request failed'} message={isConflict(error) ? `${errorMessage(error)} Your input is preserved. Review the refreshed revision and retry.` : errorMessage(error)} />
}

function parseGuidance(value: string): DraftGuidance {
  const parsed = JSON.parse(value) as DraftGuidance
  if (!parsed || typeof parsed !== 'object' || typeof parsed.guidance !== 'object' || parsed.guidance === null) throw new Error('Guidance must contain a structured guidance object.')
  return parsed
}

export function SchemaDraftsPage() {
  const { draftId = null } = useParams()
  return draftId ? <SchemaDraftWorkbench draftId={draftId} /> : <SchemaDraftList />
}

function SchemaDraftList() {
  const navigate = useNavigate()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const drafts = useSchemaDraftsQuery(selectedKnowledgeBaseId)
  const schemas = useSchemasByKnowledgeBaseQuery(selectedKnowledgeBaseId)
  const create = useCreateSchemaDraftMutation()
  const [targetName, setTargetName] = useState('')
  const [targetVersion, setTargetVersion] = useState(1)
  const [baseSchemaId, setBaseSchemaId] = useState('')
  const [guidanceText, setGuidanceText] = useState(formatJson(emptyDraftGuidance()))
  const [guidanceError, setGuidanceError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedKnowledgeBaseId) return
    try {
      const guidance = parseGuidance(guidanceText)
      setGuidanceError(null)
      create.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, payload: { targetName: targetName.trim(), targetVersion, baseSchemaId: baseSchemaId || null, guidance } }, {
        onSuccess: (draft) => navigate(`/schema-drafts/${draft.id}`),
      })
    } catch (error) {
      setGuidanceError(errorMessage(error))
    }
  }

  if (!selectedKnowledgeBaseId) {
    return <ControllerPage title='Schema Drafts' eyebrow='Planning workspace' description='Durable multi-source schema planning is separate from registered schemas.' topSectionTitle='Select a knowledge base' topSection={<EmptyState title='No knowledge base selected' description='Choose a workspace from the global selector before loading schema drafts.' />} />
  }

  return <ControllerPage
    title='Schema Drafts'
    eyebrow='Planning workspace'
    description='Build and review evidence-backed schema plans without changing registered or active schemas.'
    workspaceStrip={<WorkspaceStrip items={[{ label: 'Knowledge base', value: selectedKnowledgeBaseId }, { label: 'Drafts', value: drafts.data?.length ?? 0 }]} />}
    topSectionTitle='Drafts in this knowledge base'
    topSectionDescription='Open a durable planning resource or create a new one.'
    topSection={
      <div className='stack'>
        {drafts.error ? <Alert title='Could not load schema drafts' message={errorMessage(drafts.error)} /> : null}
        {drafts.isPending ? <p>Loading schema drafts…</p> : drafts.data?.length ? <Table ariaLabel='Schema drafts' headers={['Target', 'Lifecycle', 'Revision', 'Base', 'Publication', 'Updated']} rows={drafts.data.map((draft) => [
          <Link to={`/schema-drafts/${draft.id}`}>{draft.targetName} v{draft.targetVersion}</Link>,
          <StatusBadge label={draft.status} tone={draft.status === 'PUBLISHED' ? 'success' : 'neutral'} />,
          draft.revision,
          draft.baseSchemaId ?? 'No base schema',
          draft.publicationSchemaId ?? 'Not published',
          formatDate(draft.updatedAt),
        ])} rowKeys={drafts.data.map((draft) => draft.id)} /> : <EmptyState title='No schema drafts yet' description='Create the first planning draft below.' />}
      </div>
    }
    tabsTitle='Create draft'
    tabsDescription='The optional base must belong to this knowledge base; target identity must be compatible with the backend rules.'
    tabs={
      <form className='stack' onSubmit={submit}>
        <div className='form-grid'>
          <FieldLabel label='Target name'><Input required value={targetName} onChange={(event) => setTargetName(event.target.value)} /></FieldLabel>
          <FieldLabel label='Target version'><Input required type='number' min={1} value={targetVersion} onChange={(event) => setTargetVersion(Number(event.target.value))} /></FieldLabel>
          <FieldLabel label='Base schema (optional)'><select value={baseSchemaId} onChange={(event) => setBaseSchemaId(event.target.value)}><option value=''>No base schema</option>{schemas.data?.map((schema) => <option key={schema.id} value={schema.id}>{schema.name} v{schema.version}</option>)}</select></FieldLabel>
        </div>
        <p className='text-xs'>When using a base schema, the target name must match and target version must be greater.</p>
        <FieldLabel label='Complete structured guidance'>
          <StructuredPayloadEditor format='json' rows={18} value={guidanceText} onChange={setGuidanceText} error={guidanceError} onErrorChange={setGuidanceError} />
        </FieldLabel>
        <MutationError error={create.error} />
        <Button variant='primary' type='submit' isPending={create.isPending} disabled={!targetName.trim()}>Create draft</Button>
      </form>
    }
  />
}

type WorkbenchSection = 'overview' | 'sources' | 'analysis' | 'candidates' | 'conflicts' | 'projection' | 'diff' | 'release'
const sections: Array<{ id: WorkbenchSection; label: string }> = [
  { id: 'overview', label: 'Overview' }, { id: 'sources', label: 'Sources' }, { id: 'analysis', label: 'Analysis' },
  { id: 'candidates', label: 'Candidates' }, { id: 'conflicts', label: 'Conflicts' }, { id: 'projection', label: 'Projection' }, { id: 'diff', label: 'Diff' }, { id: 'release', label: 'Release' },
]

function SchemaDraftWorkbench({ draftId }: { draftId: string }) {
  const navigate = useNavigate()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const draft = useSchemaDraftQuery(selectedKnowledgeBaseId, draftId)
  const [section, setSection] = useState<WorkbenchSection>('overview')
  const ownerMismatch = Boolean(draft.data && draft.data.knowledgeBaseId !== selectedKnowledgeBaseId)

  useEffect(() => {
    if (ownerMismatch) navigate('/schema-drafts', { replace: true })
  }, [navigate, ownerMismatch])

  if (!selectedKnowledgeBaseId) return <ControllerPage title='Schema Draft' topSectionTitle='Select a knowledge base' topSection={<EmptyState title='No knowledge base selected' description='Select the draft owner knowledge base before opening this deep link.' />} />
  if (draft.isPending) return <ControllerPage title='Schema Draft' topSectionTitle='Loading workbench' topSection={<p>Validating draft ownership and loading authoritative state…</p>} />
  if (draft.error || !draft.data) return <ControllerPage title='Schema Draft' topSectionTitle='Draft unavailable' topSection={<Alert title='Could not open draft' message={errorMessage(draft.error)} />} />

  const value = draft.data
  const readOnly = value.status === 'PUBLISHED'
  return <ControllerPage
    title={`${value.targetName} v${value.targetVersion}`}
    eyebrow='Schema draft workbench'
    description={readOnly ? 'Published read-only audit resource. Planning mutations are disabled.' : 'Open planning resource. Revision-bearing changes use the current cached authority.'}
    actions={<Link className='button' to='/schema-drafts'>Back to drafts</Link>}
    workspaceStrip={<WorkspaceStrip items={[{ label: 'Knowledge base', value: selectedKnowledgeBaseId }, { label: 'Lifecycle', value: value.status, tone: readOnly ? 'success' : 'neutral' }, { label: 'Revision', value: value.revision }, { label: 'Aggregate', value: value.currentAggregateId ?? 'none' }]} />}
    topSectionTitle='Workbench sections'
    topSection={<div className='tabs' role='tablist'>{sections.map((item) => <button type='button' role='tab' aria-selected={section === item.id} className={`tab${section === item.id ? ' active' : ''}`} key={item.id} onClick={() => setSection(item.id)}>{item.label}</button>)}</div>}
    tabsTitle={sections.find((item) => item.id === section)?.label}
    tabs={
      section === 'overview' ? <Overview draft={value} readOnly={readOnly} /> :
      section === 'sources' ? <Sources draft={value} readOnly={readOnly} /> :
      section === 'analysis' ? <Analysis draft={value} readOnly={readOnly} /> :
      section === 'candidates' ? <Candidates draft={value} readOnly={readOnly} /> :
      section === 'conflicts' ? <Conflicts draft={value} readOnly={readOnly} /> :
      section === 'projection' ? <Projection draft={value} /> :
      section === 'diff' ? <Diff draft={value} /> : <SchemaDraftReleaseWorkflow draft={value} />
    }
  />
}

function Overview({ draft, readOnly }: { draft: DraftResponse; readOnly: boolean }) {
  const navigate = useNavigate()
  const update = useUpdateSchemaDraftMutation()
  const updateGuidance = useUpdateSchemaDraftGuidanceMutation()
  const workflow = useSchemaDraftWorkflowMutations()
  const [name, setName] = useState(draft.targetName)
  const [version, setVersion] = useState(draft.targetVersion)
  const [guidance, setGuidance] = useState(formatJson(draft.guidance))
  const [guidanceError, setGuidanceError] = useState<string | null>(null)

  const saveGuidance = () => {
    try {
      const parsed = parseGuidance(guidance)
      setGuidanceError(null)
      updateGuidance.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, payload: { revision: draft.revision, guidance: parsed } })
    } catch (error) { setGuidanceError(errorMessage(error)) }
  }

  return <div className='stack-lg'>
    {readOnly ? <Alert tone='info' title='Read-only audit record' message='Evidence, decisions, projection, diff, and publication metadata remain inspectable.' /> : null}
    <div className='grid three'>
      <div className='metric'><strong>Base schema</strong><small>{draft.baseSchemaId ?? 'None'}</small></div>
      <div className='metric'><strong>Guidance</strong><small>revision {draft.guidanceRevision} · {draft.guidanceFingerprint}</small></div>
      <div className='metric'><strong>Publication</strong><small>{draft.publicationSchemaId ?? 'Not published'}{draft.publicationContentDrifted ? ' · content drifted' : ''}</small></div>
    </div>
    <div className='grid three'>
      <WorkflowReference title='Current analysis' value={draft.currentAnalysis} current={draft.currentAnalysis?.current} />
      <WorkflowReference title='Latest evaluation' value={draft.latestEvaluation} current={draft.latestEvaluation?.current} />
      <WorkflowReference title='Latest reprocessing' value={draft.latestReprocessing} current={draft.latestReprocessing?.targetCurrent} />
    </div>
    <form className='stack' onSubmit={(event) => { event.preventDefault(); update.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, payload: { revision: draft.revision, targetName: name.trim(), targetVersion: version } }) }}>
      <div className='form-grid'><FieldLabel label='Target name'><Input disabled={readOnly} value={name} onChange={(event) => setName(event.target.value)} /></FieldLabel><FieldLabel label='Target version'><Input disabled={readOnly} type='number' min={1} value={version} onChange={(event) => setVersion(Number(event.target.value))} /></FieldLabel></div>
      <MutationError error={update.error} />
      {!readOnly ? <Button type='submit' isPending={update.isPending}>Save target</Button> : null}
    </form>
    <div className='stack'><FieldLabel label='Canonical guidance'><StructuredPayloadEditor disabled={readOnly} format='json' rows={20} value={guidance} onChange={setGuidance} error={guidanceError} onErrorChange={setGuidanceError} /></FieldLabel><MutationError error={updateGuidance.error} />{!readOnly ? <Button type='button' isPending={updateGuidance.isPending} onClick={saveGuidance}>Save guidance</Button> : null}</div>
    {!readOnly ? <div><MutationError error={workflow.deleteDraft.error} /><Button variant='danger' isPending={workflow.deleteDraft.isPending} onClick={() => { if (window.confirm(`Delete draft ${draft.targetName}?`)) workflow.deleteDraft.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, revision: draft.revision }, { onSuccess: () => navigate('/schema-drafts') }) }}>Delete draft</Button></div> : null}
  </div>
}

function WorkflowReference({ title, value, current }: { title: string; value: { id: string; status: string; statusLocation: string } | null; current?: boolean }) {
  return <div className='metric'><strong>{title}</strong><small>{value ? `${value.status} · ${current ? 'current' : 'stale'} · ${value.id}` : 'None'}</small></div>
}

function Sources({ draft, readOnly }: { draft: DraftResponse; readOnly: boolean }) {
  const queryClient = useQueryClient()
  const sources = useSchemaDraftSourcesQuery(draft.knowledgeBaseId, draft.id)
  const documents = useDocumentsQuery(draft.knowledgeBaseId)
  const workflow = useSchemaDraftWorkflowMutations()
  const [selected, setSelected] = useState<string[]>([])
  const [outcomes, setOutcomes] = useState<Record<string, string>>({})
  const [addingDocuments, setAddingDocuments] = useState(false)
  const [textName, setTextName] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const addDocuments = async () => {
    setAddingDocuments(true)
    const next = { ...outcomes }
    const unresolved: string[] = []
    for (const documentId of selected) {
      try {
        const authority = await schemaDraftsApi.get(draft.knowledgeBaseId, draft.id)
        await schemaDraftsApi.addDocumentSource(draft.knowledgeBaseId, draft.id, authority.revision, documentId)
        next[documentId] = 'Added'
      } catch (error) {
        next[documentId] = errorMessage(error)
        unresolved.push(documentId)
      }
    }
    setOutcomes(next)
    setSelected(unresolved)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraft(draft.knowledgeBaseId, draft.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraftSources(draft.knowledgeBaseId, draft.id) }),
    ])
    setAddingDocuments(false)
  }

  return <div className='stack-lg'>
    {!readOnly ? <div className='grid three'>
      <div className='stack'><h3>Existing documents</h3><div className='stack'>{documents.data?.map((doc) => <label key={doc.id}><input type='checkbox' checked={selected.includes(doc.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, doc.id] : current.filter((id) => id !== doc.id))} /> {doc.originalFilename}</label>)}</div><Button disabled={!selected.length} isPending={addingDocuments} onClick={addDocuments}>Add selected serially</Button>{Object.entries(outcomes).map(([id, result]) => <small key={id}>{id}: {result}</small>)}</div>
      <form className='stack' onSubmit={(event) => { event.preventDefault(); workflow.addText.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, revision: draft.revision, name: textName, text }, { onSuccess: () => { setTextName(''); setText('') } }) }}><h3>Pasted text</h3><Input aria-label='Text source name' placeholder='Source name' value={textName} onChange={(event) => setTextName(event.target.value)} /><Textarea aria-label='Pasted source text' placeholder='Text is submitted once and not shown in metadata views' value={text} onChange={(event) => setText(event.target.value)} /><Button type='submit' disabled={!textName.trim() || !text.trim()} isPending={workflow.addText.isPending}>Add text source</Button></form>
      <form className='stack' onSubmit={(event) => { event.preventDefault(); if (file) workflow.addFile.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, revision: draft.revision, file }, { onSuccess: () => setFile(null) }) }}><h3>Draft-owned file</h3><Input aria-label='Draft source file' type='file' onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>This upload belongs only to the draft and does not enter Documents.</small><Button type='submit' disabled={!file} isPending={workflow.addFile.isPending}>Upload file source</Button></form>
    </div> : null}
    <MutationError error={workflow.addText.error ?? workflow.addFile.error ?? workflow.refreshSource.error ?? workflow.removeSource.error ?? workflow.restoreSource.error} />
    {sources.error ? <Alert title='Could not load sources' message={errorMessage(sources.error)} /> : null}
    {sources.data?.length ? <Table ariaLabel='Draft sources' headers={['Source', 'Type / status', 'Revision', 'Fingerprint / size', 'Analyzed', 'Updated', 'Actions']} rows={sources.data.map((source) => [
      <span>{source.name ?? source.documentId ?? source.id}{source.documentId ? <small className='block'>Document {source.documentId}</small> : null}</span>,
      <span>{source.type} · {source.status}</span>, source.revision,
      <span>{source.sha256}<small className='block'>{source.sizeBytes.toLocaleString()} bytes · {source.contentType ?? 'unknown type'}</small></span>,
      source.analyzed ? 'Yes' : 'No', formatDate(source.updatedAt),
      readOnly ? 'Read only' : <div className='button-row'>{(source.status === 'STALE' || source.status === 'UNAVAILABLE') && source.type === 'DOCUMENT' ? <Button onClick={() => workflow.refreshSource.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, sourceId: source.id, revision: draft.revision })}>Refresh</Button> : null}{source.status === 'INACTIVE' ? <Button onClick={() => workflow.restoreSource.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, sourceId: source.id, revision: draft.revision })}>Restore</Button> : <Button variant='danger' onClick={() => { if (window.confirm(`Remove source ${source.name ?? source.id}?`)) workflow.removeSource.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, sourceId: source.id, revision: draft.revision }) }}>Remove</Button>}</div>,
    ])} rowKeys={sources.data.map((source) => source.id)} /> : <EmptyState title='No sources' description='Add documents, named pasted text, or a draft-owned file.' />}
  </div>
}

function Analysis({ draft, readOnly }: { draft: DraftResponse; readOnly: boolean }) {
  const queryClient = useQueryClient()
  const workflow = useSchemaDraftWorkflowMutations()
  const [historyPage, setHistoryPage] = useState(0)
  const [outcomePage, setOutcomePage] = useState(0)
  const history = useSchemaDraftAnalysisHistoryQuery(draft.knowledgeBaseId, draft.id, historyPage, 10)
  const [runId, setRunId] = useState<string | null>(draft.currentAnalysis?.id ?? null)
  const run = useSchemaDraftAnalysisRunQuery(draft.knowledgeBaseId, draft.id, runId, outcomePage, 20)
  const active = run.data && !isTerminalAnalysisStatus(run.data.status)
  const terminalRunId = run.data && isTerminalAnalysisStatus(run.data.status) ? run.data.id : null

  useEffect(() => {
    if (terminalRunId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schemaDraft(draft.knowledgeBaseId, draft.id) })
      void queryClient.invalidateQueries({ queryKey: ['schema-drafts', draft.knowledgeBaseId, draft.id] })
    }
  }, [draft.id, draft.knowledgeBaseId, queryClient, terminalRunId])

  return <div className='stack-lg'>
    <div className='button-row'>{!readOnly ? <Button variant='primary' disabled={Boolean(active)} isPending={workflow.startAnalysis.isPending} onClick={() => workflow.startAnalysis.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, revision: draft.revision }, { onSuccess: (result) => setRunId((result as { runId: string }).runId) })}>Start analysis</Button> : null}{run.data?.retryable && isTerminalAnalysisStatus(run.data.status) && !readOnly ? <Button isPending={workflow.retryAnalysis.isPending} onClick={() => workflow.retryAnalysis.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, runId: run.data.id, revision: draft.revision }, { onSuccess: (result) => setRunId((result as { runId: string }).runId) })}>Retry analysis</Button> : null}{active ? <StatusBadge label='Polling active run' tone='warning' /> : null}</div>
    <MutationError error={workflow.startAnalysis.error ?? workflow.retryAnalysis.error} />
    {run.data ? <div className='stack'><div className='grid three'><div className='metric'><strong>{run.data.status}</strong><small>Run {run.data.id} · {run.data.currentResult ? 'current' : 'stale'}</small></div><div className='metric'><strong>{run.data.succeededSources}/{run.data.totalSources} succeeded</strong><small>{run.data.failedSources} failed</small></div><div className='metric'><strong>{run.data.aggregateRevisionId ?? 'No aggregate'}</strong><small>{run.data.failureCategory ?? 'No failure category'} · {run.data.retryable ? 'retryable' : 'not retryable'}</small></div></div>
      {run.data.sourceOutcomes.content.length ? <Table headers={['Source', 'Status', 'Revision', 'Chunks', 'Execution', 'Failure']} rows={run.data.sourceOutcomes.content.map((outcome) => [outcome.sourceId, outcome.status, outcome.sourceRevision, outcome.chunkCount, outcome.reused ? 'Reused' : 'Executed', outcome.failureCategory ? `${outcome.failureCategory}${outcome.retryable ? ' · retryable' : ''}` : '—'])} rowKeys={run.data.sourceOutcomes.content.map((outcome) => outcome.id)} /> : null}<Pager page={outcomePage} size={run.data.sourceOutcomes.size} total={run.data.sourceOutcomes.totalElements} onPage={setOutcomePage} /></div> : <EmptyState title='No selected analysis run' description='Start analysis or choose a historical run below.' />}
    <div className='stack'><h3>Recent analysis history</h3>{history.data?.content.length ? <Table headers={['Run', 'Status', 'Currentness', 'Progress', 'Aggregate', 'Lineage', 'Created']} rows={history.data.content.map((item) => [<button className='link-button' type='button' onClick={() => setRunId(item.id)}>{item.id}</button>, item.status, item.current ? 'Current' : 'Stale', `${item.succeededSources}/${item.totalSources} succeeded`, item.aggregateRevisionId ?? '—', item.retryOfRunId ? `Retry of ${item.retryOfRunId}` : 'Original', formatDate(item.createdAt)])} rowKeys={history.data.content.map((item) => item.id)} /> : <p>No history returned.</p>}<Pager page={historyPage} size={history.data?.size ?? 10} total={history.data?.totalElements ?? 0} onPage={setHistoryPage} /></div>
  </div>
}

function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (page: number) => void }) {
  return <div className='button-row'><Button variant='ghost' disabled={page === 0} onClick={() => onPage(Math.max(0, page - 1))}>Previous</Button><span>Page {page + 1} · {total} total</span><Button variant='ghost' disabled={(page + 1) * size >= total} onClick={() => onPage(page + 1)}>Next</Button></div>
}

function Candidates({ draft, readOnly }: { draft: DraftResponse; readOnly: boolean }) {
  const [page, setPage] = useState(0)
  const candidates = useSchemaDraftCandidatesQuery(draft.knowledgeBaseId, draft.id, page, 25, Boolean(draft.currentAggregateId))
  const review = useSchemaDraftReviewQueries(draft.knowledgeBaseId, draft.id, Boolean(draft.currentAggregateId))
  const workflow = useSchemaDraftWorkflowMutations()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [requestedDecisionId, setRequestedDecisionId] = useState<string | null>(null)
  const requestedDecision = requestedDecisionId ? review.decisions.data?.find((item) => item.id === requestedDecisionId) : null
  const historyNavigationMessage = requestedDecisionId && review.decisions.data && !requestedDecision
    ? 'The latest decision is not present in the loaded decision history.'
    : null

  useEffect(() => {
    if (historyOpen && requestedDecision) document.getElementById(`decision-${requestedDecision.id}`)?.focus()
  }, [historyOpen, requestedDecision])

  const showDecision = (decisionId: string) => {
    setRequestedDecisionId(decisionId)
    setHistoryOpen(true)
  }

  if (!draft.currentAggregateId) return <EmptyState title='No current aggregate' description='Add active sources and run analysis before reviewing candidates.' />
  return <div className='stack-lg'>
    {candidates.error ? <Alert title='Candidate contract error' message={`${errorMessage(candidates.error)} Decision actions are disabled for this payload.`} /> : null}
    <MutationError error={workflow.decide.error} />
    <div className='candidate-review-queue'>{candidates.data?.content.map((candidate) => <CandidateReviewItem
      key={candidate.identity}
      candidate={candidate}
      readOnly={readOnly}
      actionsDisabled={Boolean(candidates.error)}
      isPending={workflow.decide.isPending}
      onDecide={(value, type, resultingValue, rationale) => workflow.decide.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, payload: { revision: draft.revision, type, candidateIdentity: value.identity, resultingValue, rationale } })}
      onShowDecision={showDecision}
    />)}</div>
    <Pager page={page} size={candidates.data?.size ?? 25} total={candidates.data?.totalElements ?? 0} onPage={setPage} />
    <details className='decision-history' open={historyOpen} onToggle={(event) => setHistoryOpen(event.currentTarget.open)}><summary><strong>Append-only decision history</strong></summary><div className='stack'>
      {historyNavigationMessage ? <p className='inline-state' role='status'>{historyNavigationMessage}</p> : null}
      {review.decisions.data?.length ? <div className='table-wrap'><table aria-label='Append-only decision history'><thead><tr>{['Sequence', 'Decision', 'Candidate', 'Review state', 'Rationale', 'Created'].map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{review.decisions.data.map((item) => <tr id={`decision-${item.id}`} tabIndex={-1} key={item.id}><td>{item.sequence}</td><td>{item.type}</td><td>{item.candidateIdentity}</td><td>{item.reviewState}</td><td>{item.rationale ?? '—'}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div> : <p>No decisions yet.</p>}
    </div></details>
  </div>
}

function Conflicts({ draft, readOnly }: { draft: DraftResponse; readOnly: boolean }) {
  const review = useSchemaDraftReviewQueries(draft.knowledgeBaseId, draft.id, Boolean(draft.currentAggregateId))
  const workflow = useSchemaDraftWorkflowMutations()
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [custom, setCustom] = useState<Record<string, string>>({})
  const [rationale, setRationale] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (!draft.currentAggregateId) return <EmptyState title='No conflicts available' description='Run analysis to produce a current aggregate.' />
  const submit = (id: string) => {
    try {
      const selectedAlternative = selected[id]
      const customText = custom[id]?.trim()
      if (Boolean(selectedAlternative) === Boolean(customText)) throw new Error('Choose exactly one existing alternative or one custom resolution.')
      const customResolution = customText ? JSON.parse(customText) as unknown : undefined
      setErrors((current) => ({ ...current, [id]: '' }))
      workflow.resolveConflict.mutate({ knowledgeBaseId: draft.knowledgeBaseId, draftId: draft.id, conflictId: id, payload: { revision: draft.revision, selectedAlternative: selectedAlternative || undefined, customResolution, rationale: rationale[id] || undefined } })
    } catch (error) { setErrors((current) => ({ ...current, [id]: errorMessage(error) })) }
  }
  return <div className='stack-lg'><MutationError error={workflow.resolveConflict.error} />{review.conflicts.data?.length ? review.conflicts.data.map((conflict) => <div className='notice stack' key={conflict.id}><div><strong>{conflict.coordinate}</strong><p>{conflict.type} · {conflict.resolved ? 'Resolved' : 'Unresolved'}</p></div><details><summary>Alternatives and evidence</summary><pre className='output-preview'>{formatJson({ alternatives: conflict.alternatives, evidence: conflict.evidence })}</pre></details>{!readOnly && !conflict.resolved ? <><FieldLabel label='Existing alternative'><select value={selected[conflict.id] ?? ''} onChange={(event) => { setSelected((current) => ({ ...current, [conflict.id]: event.target.value })); if (event.target.value) setCustom((current) => ({ ...current, [conflict.id]: '' })) }}><option value=''>Choose one</option>{(Array.isArray(conflict.alternatives) ? conflict.alternatives : Object.keys((conflict.alternatives ?? {}) as object)).map((alternative) => <option value={String(alternative)} key={String(alternative)}>{String(alternative)}</option>)}</select></FieldLabel><FieldLabel label='Or custom structured resolution'><StructuredPayloadEditor format='json' rows={7} value={custom[conflict.id] ?? ''} onChange={(value) => { setCustom((current) => ({ ...current, [conflict.id]: value })); if (value.trim()) setSelected((current) => ({ ...current, [conflict.id]: '' })) }} error={errors[conflict.id]} onErrorChange={(value) => setErrors((current) => ({ ...current, [conflict.id]: value ?? '' }))} /></FieldLabel><Input placeholder='Optional rationale' value={rationale[conflict.id] ?? ''} onChange={(event) => setRationale((current) => ({ ...current, [conflict.id]: event.target.value }))} /><Button isPending={workflow.resolveConflict.isPending} onClick={() => submit(conflict.id)}>Resolve conflict</Button></> : null}</div>) : <EmptyState title='No conflicts' description='The current aggregate has no conflicts.' />}</div>
}

function Projection({ draft }: { draft: DraftResponse }) {
  const review = useSchemaDraftReviewQueries(draft.knowledgeBaseId, draft.id, Boolean(draft.currentAggregateId))
  const [structured, setStructured] = useState(false)
  if (!draft.currentAggregateId) return <EmptyState title='No current projection' description='Add sources and run analysis to produce an effective projection.' />
  if (review.projection.error) return <Alert title='Could not load projection' message={errorMessage(review.projection.error)} />
  if (!review.projection.data) return <p>Loading effective projection…</p>
  return <div className='stack'><div className='button-row'><StatusBadge label={`Aggregate ${review.projection.data.aggregateRevisionId}`} /><StatusBadge label={`Draft revision ${review.projection.data.draftRevision}`} /><StatusBadge label={review.projection.data.publicationReady ? 'Review preconditions satisfied' : 'Review required'} tone={review.projection.data.publicationReady ? 'success' : 'warning'} /><Button variant='ghost' onClick={() => setStructured((value) => !value)}>{structured ? 'Readable view' : 'Structured JSON'}</Button></div>{structured ? <pre className='output-preview'>{formatJson(review.projection.data.schema)}</pre> : <ProjectionReadable value={review.projection.data.schema} />}<Alert tone='info' title='Projection is derived' message='Change it through candidate decisions and conflict resolutions; direct replacement editing is intentionally unavailable.' /></div>
}

function ProjectionReadable({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') return <pre className='output-preview'>{formatJson(value)}</pre>
  return <div className='stack'>{Object.entries(value).map(([key, item]) => <details key={key} open><summary><strong>{key}</strong></summary><pre className='output-preview'>{formatJson(item)}</pre></details>)}</div>
}

function Diff({ draft }: { draft: DraftResponse }) {
  const review = useSchemaDraftReviewQueries(draft.knowledgeBaseId, draft.id, Boolean(draft.currentAggregateId))
  const [compatibility, setCompatibility] = useState<'ALL' | Compatibility>('ALL')
  const [operation, setOperation] = useState('ALL')
  const operations = useMemo(() => [...new Set(review.diff.data?.changes.map((item) => item.operation) ?? [])], [review.diff.data])
  const changes = review.diff.data?.changes.filter((item) => (compatibility === 'ALL' || item.compatibility === compatibility) && (operation === 'ALL' || item.operation === operation)) ?? []
  if (!draft.currentAggregateId) return <EmptyState title='No compatibility diff' description='Run analysis to compare a current aggregate with the base schema.' />
  if (review.diff.error) return <Alert title='Could not load diff' message={errorMessage(review.diff.error)} />
  return <div className='stack'><div className='form-grid'><FieldLabel label='Compatibility'><select value={compatibility} onChange={(event) => setCompatibility(event.target.value as 'ALL' | Compatibility)}><option>ALL</option><option>ADDITIVE</option><option>REVIEW_REQUIRED</option><option>BREAKING</option></select></FieldLabel><FieldLabel label='Operation'><select value={operation} onChange={(event) => setOperation(event.target.value)}><option>ALL</option>{operations.map((value) => <option key={value}>{value}</option>)}</select></FieldLabel></div>{changes.length ? changes.map((item) => <details className={`notice ${item.compatibility === 'BREAKING' ? 'danger' : item.compatibility === 'ADDITIVE' ? 'success' : 'warning'}`} key={`${item.coordinate}:${item.operation}`}><summary><strong>{item.coordinate}</strong> · {item.operation} · {item.compatibility}</summary><div className='grid two'><div><h4>Before</h4><pre className='output-preview'>{formatJson(item.before)}</pre></div><div><h4>After</h4><pre className='output-preview'>{formatJson(item.after)}</pre></div></div></details>) : <EmptyState title='No matching changes' description='Adjust the compatibility or operation filters.' />}</div>
}
