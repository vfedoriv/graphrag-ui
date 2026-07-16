import { useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { Input } from '../../shared/ui/Input'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import { Table } from '../../shared/ui/Table'
import { candidateChanges, candidateEndpoints, candidateKindLabel, candidateSupportingValue, candidateTitle, formatConfidence, formatSupport, recommendationLabel, reviewStateLabel } from './candidatePresentation'
import type { CandidateResponse, DecisionType } from './schemaDraftTypes'

const formatJson = (value: unknown) => JSON.stringify(value, null, 2)

const recommendationTone = (state: CandidateResponse['recommendationState']) => state === 'LOW_SUPPORT' || state === 'REVIEW_REQUIRED' ? 'warning' : 'neutral'
const reviewTone = (state: CandidateResponse['effectiveReviewState']) => state === 'ACCEPTED' || state === 'PINNED' ? 'success' : state === 'REJECTED' ? 'error' : 'neutral'

export function CandidateReviewItem({ candidate, readOnly, actionsDisabled, isPending, onDecide, onShowDecision }: {
  candidate: CandidateResponse
  readOnly: boolean
  actionsDisabled: boolean
  isPending: boolean
  onDecide: (candidate: CandidateResponse, type: DecisionType, resultingValue?: unknown, rationale?: string) => void
  onShowDecision: (decisionId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [rationale, setRationale] = useState('')
  const [technicalOpen, setTechnicalOpen] = useState(false)
  const [editType, setEditType] = useState<'MODIFY' | 'PIN' | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const changes = candidateChanges(candidate)
  const endpoints = candidateEndpoints(candidate)

  const beginEdit = (type: 'MODIFY' | 'PIN') => {
    setEditType(type)
    setEditValue(formatJson(candidate))
    setEditError(null)
  }

  const submitEdit = () => {
    try {
      const result = JSON.parse(editValue) as Record<string, unknown>
      if (result.identity !== candidate.identity || result.kind !== candidate.kind) throw new Error('Modified or pinned value must preserve candidate identity and kind.')
      setEditError(null)
      onDecide(candidate, editType!, result, rationale || undefined)
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Candidate JSON is invalid')
    }
  }

  return <details className='candidate-review-item' onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className='candidate-review-summary'>
      <span className='candidate-definition'><strong>{candidateTitle(candidate)}</strong><small>{candidateKindLabel(candidate.kind)} · {candidateSupportingValue(candidate)}</small></span>
      <span className='candidate-summary-signals'>
        <span className={`candidate-signal recommendation ${candidate.recommendationState.toLowerCase()}`}><small>Analyzer recommendation</small><b>{recommendationLabel(candidate.recommendationState)}</b></span>
        <span className={`candidate-signal review ${(candidate.effectiveReviewState ?? 'unreviewed').toLowerCase()}`}><small>Review state</small><b>{reviewStateLabel(candidate.effectiveReviewState)}</b></span>
        <span className='candidate-signal'><small>Origins</small><b>{candidate.origins.join(', ') || 'None'}</b></span>
        <span className='candidate-signal'><small>Source support</small><b>{formatSupport(candidate.supportCount)}</b></span>
        <span className='candidate-signal'><small>Analyzer confidence</small><b>{formatConfidence(candidate.confidence)}</b></span>
      </span>
    </summary>
    {open ? <div className='candidate-review-body stack'>
      <div className='candidate-state-groups'>
        <div><small>Analyzer recommendation</small><StatusBadge label={recommendationLabel(candidate.recommendationState)} tone={recommendationTone(candidate.recommendationState)} /></div>
        <div><small>Persistent review state</small><StatusBadge label={reviewStateLabel(candidate.effectiveReviewState)} tone={reviewTone(candidate.effectiveReviewState)} /></div>
        <div><small>Origins</small><span className='button-row'>{candidate.origins.map((origin) => <StatusBadge key={origin} label={origin} />)}</span></div>
      </div>
      <dl className='candidate-readable-details'>
        <div><dt>Schema definition</dt><dd>{candidateTitle(candidate)}</dd></div>
        <div><dt>Kind</dt><dd>{candidateKindLabel(candidate.kind)}</dd></div>
        <div><dt>Definition value</dt><dd>{candidateSupportingValue(candidate)}</dd></div>
        {endpoints ? <div><dt>Endpoints</dt><dd>{endpoints}</dd></div> : null}
        <div><dt>Independent support</dt><dd>{formatSupport(candidate.supportCount)}</dd></div>
        <div><dt>Analyzer confidence</dt><dd>{formatConfidence(candidate.confidence)}</dd></div>
      </dl>
      {changes.length ? <div className='candidate-changes'><h4>Proposed normalization</h4><ul>{changes.map((change) => <li key={change}>{change}</li>)}</ul></div> : null}
      {candidate.latestDecisionId ? <Button variant='ghost' onClick={() => onShowDecision(candidate.latestDecisionId!)}>Show latest decision in history</Button> : null}
      <div><h4>Evidence references</h4>{candidate.evidence.length ? <Table ariaLabel={`Evidence for ${candidateTitle(candidate)}`} headers={['Source', 'Document', 'Chunk', 'Origins']} rows={candidate.evidence.map((evidence) => [evidence.sourceId, evidence.documentId ?? '—', evidence.chunkId ?? '—', evidence.origins.join(', ')])} /> : <p>No evidence references returned.</p>}</div>
      <details className='candidate-technical-details' onToggle={(event) => setTechnicalOpen(event.currentTarget.open)}><summary>Technical details</summary>{technicalOpen ? <div className='stack'>
        <p className='text-xs'>Complete candidate payload, canonical identity, transport identifiers, and evidence fingerprints.</p>
        <pre className='output-preview'>{formatJson(candidate)}</pre>
      </div> : null}</details>
      {!readOnly && !actionsDisabled ? <div className='candidate-actions stack'>
        <Input aria-label={`Optional rationale for ${candidateTitle(candidate)}`} placeholder='Optional rationale' value={rationale} onChange={(event) => setRationale(event.target.value)} />
        <div className='button-row'><Button isPending={isPending} disabled={isPending} onClick={() => onDecide(candidate, 'ACCEPT', undefined, rationale || undefined)}>Accept</Button><Button isPending={isPending} disabled={isPending} onClick={() => onDecide(candidate, 'REJECT', undefined, rationale || undefined)}>Reject</Button><Button disabled={isPending} onClick={() => beginEdit('MODIFY')}>Modify</Button><Button disabled={isPending} onClick={() => beginEdit('PIN')}>Pin</Button></div>
        {editType ? <div className='panel stack'><h4>{editType === 'MODIFY' ? 'Modify' : 'Pin'} candidate</h4><StructuredPayloadEditor format='json' rows={14} value={editValue} onChange={setEditValue} error={editError} onErrorChange={setEditError} /><div className='button-row'><Button variant='primary' isPending={isPending} disabled={isPending} onClick={submitEdit}>Submit {editType.toLowerCase()}</Button><Button disabled={isPending} onClick={() => setEditType(null)}>Cancel</Button></div></div> : null}
      </div> : null}
    </div> : null}
  </details>
}
