import { useMemo, useState } from 'react'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FieldLabel } from '../../shared/ui/FieldLabel'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import type { Compatibility, DecisionResponse, DiffBaseline, DiffItem, DiffResponse } from './schemaDraftTypes'

type CompatibilityFilter = 'ALL' | Compatibility

const compatibilityValues: Compatibility[] = ['ADDITIVE', 'REVIEW_REQUIRED', 'BREAKING']

const humanizeEnum = (value: string) => {
  const normalized = value.toLowerCase().split('_').filter(Boolean).join(' ')
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
}

const compatibilityTone = (value: Compatibility) => value === 'ADDITIVE' ? 'success' : value === 'BREAKING' ? 'error' : 'warning'

const resultLabel = (visible: number, total: number) => visible === total
  ? `Showing all ${total} ${total === 1 ? 'change' : 'changes'}`
  : `${visible} matching ${visible === 1 ? 'change' : 'changes'} · ${total} changes total`

const serializedValue = (value: unknown) => JSON.stringify(value, null, 2) ?? 'undefined'

function DiffValue({ label, value }: { label: 'Before' | 'After'; value: unknown }) {
  const missing = value === null || value === undefined
  return <section className='diff-value-panel' aria-label={`${label} value`}>
    <header>
      <h4>{label}</h4>
      {missing ? <span>No value</span> : null}
    </header>
    <pre className='diff-value-preview'>{serializedValue(value)}</pre>
  </section>
}

function DiffReviewItem({ item, explicitlyRejected }: { item: DiffItem; explicitlyRejected: boolean }) {
  const [open, setOpen] = useState(false)
  return <details className={`diff-review-item ${item.compatibility.toLowerCase()}`} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className='diff-review-summary'>
      <span className='diff-review-chevron' aria-hidden='true' />
      <span className='diff-review-definition'>
        <strong>{item.coordinate}</strong>
        <small>{humanizeEnum(item.operation)}</small>
      </span>
      <span className='diff-review-labels'>
        <StatusBadge label={humanizeEnum(item.compatibility)} tone={compatibilityTone(item.compatibility)} />
        {explicitlyRejected ? <StatusBadge label='Explicitly rejected' /> : null}
      </span>
    </summary>
    {open ? <div className='diff-review-body' role='group' aria-label={`Change values for ${item.coordinate}`}>
      <DiffValue label='Before' value={item.before} />
      <DiffValue label='After' value={item.after} />
    </div> : null}
  </details>
}

const baselineDescription = (baseline: DiffBaseline) => baseline.type === 'BASE_SCHEMA'
  ? `Base schema ${baseline.id ?? 'identifier unavailable'}`
  : baseline.type === 'PREVIOUS_AGGREGATE'
    ? `Previous aggregate ${baseline.id ?? 'identifier unavailable'}`
    : 'Empty starting point'

function ComparisonSummary({ diff }: { diff: DiffResponse }) {
  return <section className='diff-comparison-summary' aria-labelledby='diff-comparison-title'>
    <div>
      <h3 id='diff-comparison-title'>Comparison baseline</h3>
      <p>{diff.baseline
        ? <>Current aggregate <strong>{diff.aggregateRevisionId}</strong> is compared with {baselineDescription(diff.baseline)}.</>
        : <>Current aggregate <strong>{diff.aggregateRevisionId}</strong> has comparison baseline metadata unavailable.</>}</p>
    </div>
    <dl className='diff-comparison-audit'>
      <div><dt>Draft revision</dt><dd>{diff.draftRevision ?? 'Unavailable'}</dd></div>
      {diff.baseline ? <div><dt>Baseline content hash</dt><dd>{diff.baseline.contentHash}</dd></div> : null}
    </dl>
  </section>
}

export function SchemaDiffReview({ diff, decisions = [] }: { diff: DiffResponse; decisions?: DecisionResponse[] }) {
  const { changes } = diff
  const [compatibility, setCompatibility] = useState<CompatibilityFilter>('ALL')
  const [operation, setOperation] = useState('ALL')
  const operations = useMemo(() => [...new Set(changes.map((item) => item.operation))], [changes])
  const counts = useMemo(() => Object.fromEntries(compatibilityValues.map((value) => [value, changes.filter((item) => item.compatibility === value).length])) as Record<Compatibility, number>, [changes])
  const visibleChanges = useMemo(() => changes.filter((item) =>
    (compatibility === 'ALL' || item.compatibility === compatibility) &&
    (operation === 'ALL' || item.operation === operation),
  ), [changes, compatibility, operation])
  const latestDecisions = useMemo(() => {
    const byIdentity = new Map<string, DecisionResponse>()
    decisions.forEach((decision) => {
      const current = byIdentity.get(decision.candidateIdentity)
      if (!current || decision.sequence > current.sequence) byIdentity.set(decision.candidateIdentity, decision)
    })
    return byIdentity
  }, [decisions])
  const filtersActive = compatibility !== 'ALL' || operation !== 'ALL'
  const clearFilters = () => {
    setCompatibility('ALL')
    setOperation('ALL')
  }

  return <div className='diff-review stack'>
    <ComparisonSummary diff={diff} />
    <section className='diff-review-overview' aria-labelledby='diff-overview-title'>
      <div>
        <h3 id='diff-overview-title'>Compatibility overview</h3>
        <p>{changes.length} {changes.length === 1 ? 'schema change' : 'schema changes'} in this aggregate</p>
      </div>
      <dl className='diff-risk-counts'>
        {compatibilityValues.map((value) => <div className={value.toLowerCase()} key={value}>
          <dt>{humanizeEnum(value)}</dt>
          <dd>{counts[value]}</dd>
        </div>)}
      </dl>
    </section>

    <section className='diff-filter-toolbar' aria-label='Diff filters'>
      <div className='diff-filter-controls'>
        <FieldLabel label='Compatibility status'>
          <select aria-label='Compatibility status' value={compatibility} onChange={(event) => setCompatibility(event.target.value as CompatibilityFilter)}>
            <option value='ALL'>All statuses</option>
            {compatibilityValues.map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel label='Change operation'>
          <select aria-label='Change operation' value={operation} onChange={(event) => setOperation(event.target.value)}>
            <option value='ALL'>All operations</option>
            {operations.map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}
          </select>
        </FieldLabel>
      </div>
      <div className='diff-filter-context'>
        <p aria-live='polite'>{resultLabel(visibleChanges.length, changes.length)}</p>
        {filtersActive ? <Button type='button' variant='ghost' onClick={clearFilters}>Clear filters</Button> : null}
      </div>
    </section>

    {visibleChanges.length ? <div className='diff-review-queue'>
      {visibleChanges.map((item, index) => <DiffReviewItem item={item} explicitlyRejected={latestDecisions.get(item.coordinate)?.type === 'REJECT'} key={`${item.coordinate}:${item.operation}:${index}`} />)}
    </div> : <EmptyState
      title={filtersActive ? 'No matching changes' : 'No schema changes'}
      description={filtersActive ? 'Clear or adjust the filters to see other compatibility changes.' : 'The current aggregate does not change the selected comparison baseline.'}
    />}
  </div>
}
