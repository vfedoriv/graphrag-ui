import { useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { Input } from '../../shared/ui/Input'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { StructuredPayloadEditor } from '../../shared/ui/StructuredPayloadEditor'
import type { ConflictResponse, ResolveConflictRequest } from './schemaDraftTypes'

type ResolutionMode = 'suggested' | 'custom'

type ConflictAlternative = {
  id: string
  label: string
  value: unknown
}

const safeJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2) ?? String(value)
  } catch {
    return String(value)
  }
}

const compactValue = (value: unknown): string => {
  if (value === null) return 'Null'
  if (typeof value === 'string') return value || 'Empty string'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.length === 1 ? compactValue(value[0]) : `${value.length} values`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 1) return `${entries[0][0]}: ${compactValue(entries[0][1])}`
    return `${entries.length} fields`
  }
  return String(value)
}

const conflictTypeLabel = (type: string) => {
  const words = type.trim().replace(/[_-]+/g, ' ').toLowerCase()
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : 'Conflict'
}

const conflictEvidenceSummary = (evidence: unknown) => {
  if (Array.isArray(evidence)) return evidence.length === 1 ? '1 evidence record' : `${evidence.length} evidence records`
  if (evidence === null || evidence === undefined) return 'No evidence returned'
  if (typeof evidence === 'object') {
    const count = Object.keys(evidence).length
    return count ? `Evidence available · ${count} ${count === 1 ? 'field' : 'fields'}` : 'No evidence returned'
  }
  return 'Evidence available'
}

const conflictAlternatives = (alternatives: unknown): ConflictAlternative[] => {
  if (Array.isArray(alternatives)) return alternatives.map((value) => {
    const id = typeof value === 'string' ? value : safeJson(value)
    return { id, label: compactValue(value), value }
  })
  if (alternatives && typeof alternatives === 'object') return Object.entries(alternatives).map(([id, value]) => ({ id, label: compactValue(value), value }))
  if (alternatives === null || alternatives === undefined) return []
  return [{ id: String(alternatives), label: compactValue(alternatives), value: alternatives }]
}

const parseCustomResolution = (value: string) => {
  if (!value.trim()) return { valid: false as const }
  try {
    return { valid: true as const, value: JSON.parse(value) as unknown }
  } catch {
    return { valid: false as const }
  }
}

const resolvedValue = (conflict: ConflictResponse) => {
  if (conflict.selectedAlternative) return `Suggested value: ${conflict.selectedAlternative}`
  if (conflict.customResolution !== null && conflict.customResolution !== undefined) return `Custom value: ${compactValue(conflict.customResolution)}`
  return 'No resolution value returned'
}

export function ConflictReviewItem({ conflict, readOnly, open, isPending, onToggle, onResolve }: {
  conflict: ConflictResponse
  readOnly: boolean
  open: boolean
  isPending: boolean
  onToggle: () => void
  onResolve: (conflictId: string, payload: Omit<ResolveConflictRequest, 'revision'>) => void
}) {
  const alternatives = conflictAlternatives(conflict.alternatives)
  const [mode, setMode] = useState<ResolutionMode>(alternatives.length ? 'suggested' : 'custom')
  const [selectedAlternative, setSelectedAlternative] = useState('')
  const [customResolution, setCustomResolution] = useState('')
  const [rationale, setRationale] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const parsedCustom = parseCustomResolution(customResolution)
  const canResolve = mode === 'suggested' ? Boolean(selectedAlternative) : parsedCustom.valid
  const panelId = `conflict-panel-${conflict.id}`
  const mutable = !readOnly && !conflict.resolved

  const changeMode = (nextMode: ResolutionMode) => {
    setMode(nextMode)
    setCustomError(null)
    if (nextMode === 'suggested') setCustomResolution('')
    else setSelectedAlternative('')
  }

  const submit = () => {
    if (mode === 'suggested') {
      if (!selectedAlternative) return
      onResolve(conflict.id, { selectedAlternative, rationale: rationale.trim() || undefined })
      return
    }
    if (!parsedCustom.valid) {
      setCustomError('Enter a valid JSON value before resolving this conflict.')
      return
    }
    setCustomError(null)
    onResolve(conflict.id, { customResolution: parsedCustom.value, rationale: rationale.trim() || undefined })
  }

  return <article className={`conflict-review-item${open ? ' active' : ''}${conflict.resolved ? ' resolved' : ''}`}>
    <div className='conflict-review-summary'>
      <div className='conflict-review-heading'>
        <strong>{conflict.coordinate}</strong>
        <span className='conflict-review-meta'>{conflictTypeLabel(conflict.type)} · {conflictEvidenceSummary(conflict.evidence)}</span>
      </div>
      <div className='conflict-review-state'>
        <StatusBadge label={conflict.resolved ? 'Resolved' : 'Needs decision'} tone={conflict.resolved ? 'success' : 'warning'} />
        <span>{conflict.resolved ? resolvedValue(conflict) : `Choose which value should be used for ${conflict.coordinate}.`}</span>
      </div>
      <Button type='button' variant='ghost' aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        {open ? 'Close' : mutable ? 'Review conflict' : 'View details'}
      </Button>
    </div>

    {open ? <div className='conflict-review-panel stack' id={panelId}>
      {mutable ? <>
        <fieldset className='conflict-resolution-modes'>
          <legend>How do you want to resolve this conflict?</legend>
          <label><input type='radio' name={`resolution-mode-${conflict.id}`} value='suggested' checked={mode === 'suggested'} disabled={!alternatives.length} onChange={() => changeMode('suggested')} /> <span><strong>Use a suggested value</strong><small>Choose one of the values found during analysis.</small></span></label>
          <label><input type='radio' name={`resolution-mode-${conflict.id}`} value='custom' checked={mode === 'custom'} onChange={() => changeMode('custom')} /> <span><strong>Enter a custom value</strong><small>Provide a structured JSON value when none of the suggestions fit.</small></span></label>
        </fieldset>

        {mode === 'suggested' ? <fieldset className='conflict-alternatives'>
          <legend>Choose the value to keep</legend>
          {alternatives.map((alternative, index) => <label className={`conflict-alternative${selectedAlternative === alternative.id ? ' selected' : ''}`} key={`${alternative.id}-${index}`}>
            <input type='radio' name={`conflict-alternative-${conflict.id}`} value={alternative.id} checked={selectedAlternative === alternative.id} onChange={() => setSelectedAlternative(alternative.id)} />
            <span><strong>{alternative.label}</strong>{typeof alternative.value === 'object' && alternative.value !== null ? <small>{safeJson(alternative.value)}</small> : null}</span>
          </label>)}
        </fieldset> : <div className='conflict-custom-resolution'>
          <StructuredPayloadEditor aria-label={`Custom resolution for ${conflict.coordinate}`} format='json' rows={7} value={customResolution} onChange={(value) => { setCustomResolution(value); setCustomError(null) }} error={customError ?? (customResolution.trim() && !parsedCustom.valid ? 'Enter a valid JSON value.' : null)} onErrorChange={setCustomError} />
        </div>}

        <Input aria-label={`Optional rationale for ${conflict.coordinate}`} placeholder='Optional rationale' value={rationale} onChange={(event) => setRationale(event.target.value)} />
        <div className='conflict-resolution-actions'><Button variant='primary' isPending={isPending} disabled={!canResolve || isPending} onClick={submit}>Resolve conflict</Button></div>
      </> : <div className='conflict-read-only-value'><strong>Resolution</strong><p>{resolvedValue(conflict)}</p>{conflict.customResolution !== null && conflict.customResolution !== undefined ? <pre className='output-preview compact'>{safeJson(conflict.customResolution)}</pre> : null}</div>}

      <details className='conflict-disclosure'><summary>Evidence details</summary><div className='conflict-disclosure-body'><pre className='output-preview compact'>{safeJson(conflict.evidence)}</pre></div></details>
      <details className='conflict-disclosure'><summary>Technical details</summary><div className='conflict-disclosure-body'><pre className='output-preview compact'>{safeJson({ type: conflict.type, alternatives: conflict.alternatives })}</pre></div></details>
    </div> : null}
  </article>
}
