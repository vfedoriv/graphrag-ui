import { Link } from 'react-router-dom'
import { Alert } from '../../shared/ui/Alert'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import type {
  AdvancedSearchAnswer,
  AdvancedSearchClaim,
  AdvancedSearchEvidence,
  AdvancedSearchGraphFact,
  AdvancedSearchResultParseResult,
  AdvancedSearchResultV1,
  DocumentUpload,
} from '../../api/types'
import { buildAdvancedSearchResultMaps, chunkExplorerHref, resolveAdvancedSearchSourceLabel, type AdvancedSearchResultMaps } from './advancedSearchResultHelpers'

type AdvancedSearchResultPanelProps = {
  parsed?: AdvancedSearchResultParseResult
  runStatus: string
  runFailureCategory?: string | null
  documents: DocumentUpload[]
}

export function AdvancedSearchResultPanel({ parsed, runStatus, runFailureCategory, documents }: AdvancedSearchResultPanelProps) {
  if (!parsed) return null

  if (parsed.kind !== 'VALID') {
    const title = parsed.kind === 'UNSUPPORTED_VERSION'
      ? 'Unsupported advanced-search result'
      : 'Malformed advanced-search result'
    const message = parsed.kind === 'UNSUPPORTED_VERSION'
      ? `${parsed.reason}. The frontend keeps the payload intact and does not coerce it into version one.`
      : `${parsed.reason ?? 'The supported result payload did not satisfy its required structure'}. Semantic result rendering was stopped so that broken references are not presented as trustworthy evidence.`

    return (
      <section className='flow-card stack' data-testid='advanced-search-result-failure'>
        <Alert title={title} message={message} />
        <details>
          <summary>Raw result JSON</summary>
          <pre className='output advanced-search-raw-output'>{formatJson(parsed.raw)}</pre>
        </details>
      </section>
    )
  }

  return (
    <CitedResultContent
      result={parsed.result}
      raw={parsed.raw}
      runStatus={runStatus}
      runFailureCategory={runFailureCategory}
      documents={documents}
    />
  )
}

function CitedResultContent({ result, raw, runStatus, runFailureCategory, documents }: {
  result: AdvancedSearchResultV1
  raw: unknown
  runStatus: string
  runFailureCategory?: string | null
  documents: DocumentUpload[]
}) {
  const maps = buildAdvancedSearchResultMaps(result)
  const referenceWarnings = collectReferenceWarnings(result, maps)
  const diagnosticWarnings = collectDiagnosticWarnings(result)
  const warnings = [...referenceWarnings, ...diagnosticWarnings]

  return (
    <section className='stack-lg' data-testid='advanced-search-cited-result'>
      {runStatus === 'PARTIAL' ? (
        <Alert
          title='Partial result'
          message={runFailureCategory ? `Usable branches are shown. Some branches reported: ${runFailureCategory}.` : 'Usable branches are shown alongside their limitations and diagnostics.'}
          tone='info'
        />
      ) : null}
      {warnings.length > 0 ? (
        <Alert
          title='Result warnings'
          message={`${warnings.slice(0, 3).join(' ')}${warnings.length > 3 ? ` ${warnings.length - 3} more warning${warnings.length - 3 === 1 ? '' : 's'} are available in diagnostics.` : ''}`}
          tone='info'
        />
      ) : null}
      <AnswerPanel answer={result.answer} diagnostics={result.answerDiagnostics} />
      <ClaimsPanel claims={result.answer.claims} maps={maps} />
      <EvidenceSection title='Ranked evidence' entries={result.evidence} documents={documents} maps={maps} />
      <EvidenceSection title='Context-only entries' entries={result.contexts} documents={documents} maps={maps} contextOnly />
      <GraphFactsSection facts={result.graphFacts} maps={maps} />
      <DiagnosticsPanel result={result} raw={raw} />
    </section>
  )
}

function AnswerPanel({ answer, diagnostics }: { answer: AdvancedSearchAnswer; diagnostics: AdvancedSearchResultV1['answerDiagnostics'] }) {
  const status = answer.status || 'UNKNOWN'
  const normalizedStatus = status.toUpperCase()
  const insufficient = normalizedStatus.includes('INSUFFICIENT') || normalizedStatus.includes('ABSTAIN') || diagnostics.abstained
  const unavailable = !answer.text || normalizedStatus.includes('UNAVAILABLE') || normalizedStatus.includes('NO_ANSWER')

  return (
    <section className='flow-card stack' aria-label='Advanced search answer'>
      <div className='split-stack'>
        <div>
          <p className='eyebrow'>Cited answer</p>
          <h3>Answer</h3>
        </div>
        <StatusBadge label={status} tone={insufficient ? 'warning' : unavailable ? 'neutral' : 'success'} />
      </div>
      {insufficient ? <Alert title='Insufficient evidence' message='The answer was withheld or qualified because the returned evidence did not support complete coverage.' tone='info' /> : null}
      {!insufficient && unavailable ? <Alert title='Answer unavailable' message='The run did not return readable answer text. Returned evidence, limitations, and diagnostics remain available below.' tone='info' /> : null}
      {!insufficient && !unavailable ? <OutputPreview label='Answer text'>{answer.text}</OutputPreview> : null}
      <dl className='grid three'>
        <div><dt className='font-semibold'>Answer status</dt><dd>{status}</dd></div>
        <div><dt className='font-semibold'>Confidence level</dt><dd>{answer.confidence?.level ?? 'Not reported'}</dd></div>
        <div><dt className='font-semibold'>Confidence score</dt><dd>{answer.confidence?.score ?? 'Not reported'}</dd></div>
        <div><dt className='font-semibold'>Claims</dt><dd>{answer.claims.length}</dd></div>
        <div><dt className='font-semibold'>Citations</dt><dd>{diagnostics.citationCount}</dd></div>
        <div><dt className='font-semibold'>Outcome</dt><dd>{diagnostics.outcomeCategory}</dd></div>
      </dl>
      <div className='stack'>
        <h4>Limitations</h4>
        {answer.limitations.length === 0 ? <p className='muted'>No limitations reported.</p> : (
          <ul>
            {answer.limitations.map((limitation) => <li key={`${limitation.code}-${limitation.description}`}><code>{limitation.code}</code>: {limitation.description}</li>)}
          </ul>
        )}
      </div>
    </section>
  )
}

function ClaimsPanel({ claims, maps }: { claims: AdvancedSearchClaim[]; maps: AdvancedSearchResultMaps }) {
  return (
    <section className='stack' aria-label='Answer claims'>
      <div className='split-stack'>
        <div><p className='eyebrow'>Traceable assertions</p><h3>Claims</h3></div>
        <StatusBadge label={`${claims.length} claim${claims.length === 1 ? '' : 's'}`} tone='neutral' />
      </div>
      {claims.length === 0 ? <p className='muted'>No claims returned.</p> : (
        <div className='stack'>
          {claims.map((claim) => (
            <article key={claim.id} className='flow-card' data-testid={`advanced-search-claim-${claim.id}`}>
              <div className='split-stack'><h4>{claim.kind} · {claim.id}</h4><StatusBadge label='Claim' tone='neutral' /></div>
              <p>{claim.text}</p>
              <ReferenceChips claim={claim} maps={maps} />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ReferenceChips({ claim, maps }: { claim: AdvancedSearchClaim; maps: AdvancedSearchResultMaps }) {
  const hasReferences = claim.citationIds.length > 0 || claim.graphFactIds.length > 0 || claim.graphEvidenceIds.length > 0
  if (!hasReferences) return <p className='muted'>No evidence or graph references returned.</p>

  return (
    <div className='toolbar' aria-label={`References for claim ${claim.id}`}>
      {claim.citationIds.map((citationId) => maps.evidenceByCitationId.has(citationId)
        ? <a key={`citation-${citationId}`} className='schema-draft-target-link' href={`#${citationAnchor(citationId)}`}>Citation {citationId}</a>
        : <span key={`citation-${citationId}`} className='muted'>Missing citation {citationId}</span>)}
      {claim.graphFactIds.map((factId) => maps.graphFactById.has(factId)
        ? <a key={`fact-${factId}`} className='schema-draft-target-link' href={`#${graphFactAnchor(factId)}`}>Graph fact {factId}</a>
        : <span key={`fact-${factId}`} className='muted'>Missing graph fact {factId}</span>)}
      {claim.graphEvidenceIds.map((citationId) => maps.evidenceByCitationId.has(citationId)
        ? <a key={`graph-evidence-${citationId}`} className='schema-draft-target-link' href={`#${citationAnchor(citationId)}`}>Graph evidence {citationId}</a>
        : <span key={`graph-evidence-${citationId}`} className='muted'>Missing graph evidence {citationId}</span>)}
    </div>
  )
}

function EvidenceSection({ title, entries, documents, maps, contextOnly = false }: {
  title: string
  entries: AdvancedSearchEvidence[]
  documents: DocumentUpload[]
  maps: AdvancedSearchResultMaps
  contextOnly?: boolean
}) {
  return (
    <section className='stack' aria-label={title}>
      <div className='split-stack'>
        <div><p className='eyebrow'>{contextOnly ? 'Supporting context' : 'Ranked source material'}</p><h3>{title}</h3></div>
        <StatusBadge label={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`} tone='neutral' />
      </div>
      {entries.length === 0 ? <p className='muted'>{contextOnly ? 'No context-only entries returned.' : 'No ranked evidence returned.'}</p> : (
        <div className='stack'>
          {entries.map((entry) => <EvidenceCard key={`${title}-${entry.citationId}`} entry={entry} documents={documents} maps={maps} contextOnly={contextOnly} />)}
        </div>
      )}
    </section>
  )
}

function EvidenceCard({ entry, documents, maps, contextOnly }: { entry: AdvancedSearchEvidence; documents: DocumentUpload[]; maps: AdvancedSearchResultMaps; contextOnly: boolean }) {
  const sourceLabel = resolveAdvancedSearchSourceLabel(entry, documents)
  const directHref = chunkExplorerHref(entry)
  return (
    <article id={citationAnchor(entry.citationId)} className='flow-card stack' data-testid={`advanced-search-citation-${entry.citationId}`}>
      <div className='split-stack'>
        <div><p className='eyebrow'>{contextOnly ? 'Context citation' : 'Citation'}</p><h4>{entry.citationId}</h4></div>
        {directHref ? <Link className='button' to={directHref}>Inspect chunk</Link> : <span className='muted'>Chunk inspection unavailable</span>}
      </div>
      <dl className='grid three'>
        <div><dt className='font-semibold'>Source</dt><dd>{sourceLabel}</dd></div>
        <div><dt className='font-semibold'>Snapshot type</dt><dd>{entry.sourceContentType ?? entry.type ?? 'Not recorded'}</dd></div>
        <div><dt className='font-semibold'>Evidence type</dt><dd>{entry.type}</dd></div>
        <div><dt className='font-semibold'>Source range</dt><dd>{formatRange(entry.range?.sourceStart, entry.range?.sourceEnd)}</dd></div>
        <div><dt className='font-semibold'>Page range</dt><dd>{formatRange(entry.range?.pageStart, entry.range?.pageEnd)}</dd></div>
        <div><dt className='font-semibold'>Structural path</dt><dd>{entry.structuralPath ?? 'Not recorded'}</dd></div>
        <div><dt className='font-semibold'>Processing revision</dt><dd>{entry.processingRunId ?? 'Not recorded'}</dd></div>
        <div><dt className='font-semibold'>Effective chunker revision</dt><dd>{entry.effectiveChunkerRevision ?? 'Not recorded'}</dd></div>
        <div><dt className='font-semibold'>Rank</dt><dd>{entry.rank}</dd></div>
        <div><dt className='font-semibold'>Score</dt><dd>{entry.score ?? 'Not recorded'}</dd></div>
        <div><dt className='font-semibold'>Document ID</dt><dd>{entry.documentId ?? 'Not recorded'}</dd></div>
        <div><dt className='font-semibold'>Chunk ID</dt><dd>{entry.chunkId ?? 'Not recorded'}</dd></div>
      </dl>
      {entry.text ? <OutputPreview label='Evidence excerpt'>{entry.text}</OutputPreview> : <Alert title='Excerpt not included' message='Evidence text was disabled or unavailable. Citation and provenance metadata are retained.' tone='info' />}
      {maps.evidenceByCitationId.get(entry.citationId) !== entry ? <Alert title='Duplicate citation ID' message='This entry shares an ID with another result entry. References resolve to the first server entry.' tone='info' /> : null}
    </article>
  )
}

function GraphFactsSection({ facts, maps }: { facts: AdvancedSearchGraphFact[]; maps: AdvancedSearchResultMaps }) {
  return (
    <section className='stack' aria-label='Graph facts'>
      <div className='split-stack'><div><p className='eyebrow'>Graph branch</p><h3>Graph facts</h3></div><StatusBadge label={`${facts.length} fact${facts.length === 1 ? '' : 's'}`} tone='neutral' /></div>
      {facts.length === 0 ? <p className='muted'>No graph facts returned.</p> : (
        <div className='stack'>
          {facts.map((fact) => (
            <article key={fact.factId} id={graphFactAnchor(fact.factId)} className='flow-card stack' data-testid={`advanced-search-graph-fact-${fact.factId}`}>
              <h4>Graph fact {fact.factId}</h4>
              <ReferenceList label='Evidence references' ids={fact.evidenceIds} known={(id) => maps.evidenceByCitationId.has(id)} anchor={citationAnchor} />
              <ReferenceList label='Citation references' ids={fact.citationIds} known={(id) => maps.evidenceByCitationId.has(id)} anchor={citationAnchor} />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ReferenceList({ label, ids, known, anchor }: { label: string; ids: string[]; known: (id: string) => boolean; anchor: (id: string) => string }) {
  return (
    <div className='stack'>
      <h5>{label}</h5>
      {ids.length === 0 ? <p className='muted'>None returned.</p> : <div className='toolbar'>{ids.map((id) => known(id) ? <a key={id} className='schema-draft-target-link' href={`#${anchor(id)}`}>{id}</a> : <span key={id} className='muted'>Missing reference {id}</span>)}</div>}
    </div>
  )
}

function DiagnosticsPanel({ result, raw }: { result: AdvancedSearchResultV1; raw: unknown }) {
  const sections: Array<[string, unknown]> = [
    ['Planning diagnostics', result.diagnostics.plan],
    ['Sufficiency diagnostics', result.diagnostics.sufficiency],
    ['Follow-up diagnostics', result.diagnostics.followUp],
    ['Retriever attempts', result.diagnostics.attempts],
    ['Fusion diagnostics', result.diagnostics.fusion],
    ['Graph expansion diagnostics', result.diagnostics.graphExpansion],
    ['Parent-context diagnostics', result.diagnostics.parentContext],
    ['Reranking diagnostics', result.diagnostics.rerank],
    ['Selection diagnostics', result.diagnostics.selection],
    ['Source-metadata diagnostics', result.diagnostics.sourceMetadata],
    ['Answer diagnostics', result.answerDiagnostics],
  ]
  return (
    <section className='stack' aria-label='Advanced search diagnostics'>
      <div><p className='eyebrow'>Operator context</p><h3>Diagnostics</h3></div>
      {sections.map(([label, value]) => <details key={label}><summary>{label}</summary><pre className='output compact advanced-search-diagnostic-output'>{formatJson(value)}</pre></details>)}
      <details><summary>Raw result JSON</summary><pre className='output advanced-search-raw-output'>{formatJson(raw)}</pre></details>
    </section>
  )
}

function collectReferenceWarnings(result: AdvancedSearchResultV1, maps: AdvancedSearchResultMaps) {
  const warnings: string[] = []
  const addMissing = (owner: string, type: string, id: string, known: boolean) => {
    if (!known) warnings.push(`${owner} references missing ${type} ${id}.`)
  }
  for (const claim of result.answer.claims) {
    claim.citationIds.forEach((id) => addMissing(`Claim ${claim.id}`, 'citation', id, maps.evidenceByCitationId.has(id)))
    claim.graphFactIds.forEach((id) => addMissing(`Claim ${claim.id}`, 'graph fact', id, maps.graphFactById.has(id)))
    claim.graphEvidenceIds.forEach((id) => addMissing(`Claim ${claim.id}`, 'graph evidence', id, maps.evidenceByCitationId.has(id)))
  }
  for (const fact of result.graphFacts) {
    fact.evidenceIds.forEach((id) => addMissing(`Graph fact ${fact.factId}`, 'evidence', id, maps.evidenceByCitationId.has(id)))
    fact.citationIds.forEach((id) => addMissing(`Graph fact ${fact.factId}`, 'citation', id, maps.evidenceByCitationId.has(id)))
  }
  return warnings
}

function collectDiagnosticWarnings(result: AdvancedSearchResultV1) {
  const warnings: string[] = []
  const diagnostics = result.diagnostics
  if (diagnostics.plan?.fallbackUsed) warnings.push(`Planning fallback used${diagnostics.plan.fallbackCategory ? ` (${diagnostics.plan.fallbackCategory})` : ''}.`)
  if (diagnostics.sufficiency?.fallbackUsed) warnings.push(`Sufficiency fallback used${diagnostics.sufficiency.fallbackCategory ? ` (${diagnostics.sufficiency.fallbackCategory})` : ''}.`)
  if (diagnostics.rerank?.fallbackUsed) warnings.push(`Reranking fallback used${diagnostics.rerank.fallbackCategory ? ` (${diagnostics.rerank.fallbackCategory})` : ''}.`)
  diagnostics.sourceMetadata?.warnings.forEach((warning) => warnings.push(`Source metadata warning: ${warning}`))
  diagnostics.attempts.filter((attempt) => attempt.status.toUpperCase() !== 'SUCCEEDED' && attempt.status.toUpperCase() !== 'COMPLETED').forEach((attempt) => warnings.push(`Retriever attempt ${attempt.subqueryId} reported ${attempt.status}.`))
  return warnings
}

function citationAnchor(id: string) {
  return `advanced-search-citation-${encodeURIComponent(id)}`
}

function graphFactAnchor(id: string) {
  return `advanced-search-graph-fact-${encodeURIComponent(id)}`
}

function formatRange(start: number | null | undefined, end: number | null | undefined) {
  if (start === null || start === undefined) return end === null || end === undefined ? 'Not recorded' : `Not recorded → ${end}`
  if (end === null || end === undefined) return `${start} → Not recorded`
  return `${start} → ${end}`
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2)
  } catch {
    return String(value)
  }
}
