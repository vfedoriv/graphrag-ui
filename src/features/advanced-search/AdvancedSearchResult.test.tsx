import { MemoryRouter } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdvancedSearchResultPanel } from './AdvancedSearchResult'
import { chunkExplorerHref, resolveAdvancedSearchSourceLabel } from './advancedSearchResultHelpers'
import type { AdvancedSearchResultV1, DocumentUpload } from '../../api/types'

const diagnostics = {
  plan: { version: 1, promptRevision: 'p1', subquestionCount: 1, exactTermCount: 0, graphRequestCount: 0, metadataConstrained: false, fallbackUsed: false, fallbackCategory: null },
  sufficiency: { version: 1, promptRevision: 'p1', completeCoverageCount: 1, partialCoverageCount: 0, missingCoverageCount: 0, contradictionCount: 0, concreteGap: false, refinementCount: 0, fallbackUsed: false, fallbackCategory: null },
  followUp: { executed: false, queryCount: 0, skippedCategory: null },
  attempts: [],
  fusion: null,
  graphExpansion: null,
  parentContext: null,
  rerank: null,
  selection: null,
  sourceMetadata: { warnings: [] },
}

const baseResult: AdvancedSearchResultV1 = {
  payloadVersion: 1,
  answer: {
    version: 1,
    status: 'ANSWERED',
    text: 'Ada is active.',
    confidence: { level: 'HIGH', score: 0.9 },
    limitations: [],
    claims: [{ id: 'claim-1', kind: 'ANSWER', text: 'Ada is active.', citationIds: ['citation-1'], graphFactIds: ['fact-1'], graphEvidenceIds: ['citation-1'] }],
  },
  evidence: [{
    citationId: 'citation-1', type: 'TEXT_CHILD', chunkId: 'chunk-1', documentId: 'doc-1',
    range: { sourceStart: 10, sourceEnd: 20, pageStart: 2, pageEnd: 2 }, processingRunId: 'process-1', effectiveChunkerRevision: 'chunker-v2',
    structuralPath: 'Customers > Active', text: 'Ada is an active customer.', rank: 1, score: 0.8,
    sourceFilename: null, sourceContentType: 'text/plain', sourceDisplayLabel: null,
  }],
  contexts: [{
    citationId: 'context-1', type: 'PARENT', chunkId: null, documentId: 'doc-1', range: null, processingRunId: null,
    effectiveChunkerRevision: null, structuralPath: null, text: null, rank: 0, score: null,
    sourceFilename: null, sourceContentType: null, sourceDisplayLabel: null,
  }],
  graphFacts: [{ factId: 'fact-1', evidenceIds: ['citation-1'], citationIds: ['missing-citation'] }],
  answerDiagnostics: { repairAttempted: false, repairSucceeded: false, abstained: false, citationCount: 1, claimCount: 1, outcomeCategory: 'ANSWERED' },
  diagnostics,
}

const documents: DocumentUpload[] = [{
  id: 'doc-1', knowledgeBaseId: 'kb-1', originalFilename: 'cached-document.md', contentType: 'text/markdown', sizeBytes: 10,
  sha256: 'sha', contentUri: 'memory://doc', status: 'PROCESSED', uploadedAt: '2026-08-01T00:00:00Z', processedAt: null, errorMessage: null,
}]

function renderResult(result: AdvancedSearchResultV1 = baseResult, documentsOverride = documents, runStatus = 'COMPLETED') {
  return render(
    <MemoryRouter>
      <AdvancedSearchResultPanel
        parsed={{ kind: 'VALID', envelope: { runId: 'run-1', payloadVersion: 1, result, createdAt: '2026-08-02T00:00:00Z' }, result, raw: { raw: true } }}
        runStatus={runStatus}
        documents={documentsOverride}
      />
    </MemoryRouter>,
  )
}

describe('AdvancedSearchResultPanel', () => {
  it('renders answer, claims, ordered evidence, context, graph references, and no inline citation fabrication', () => {
    renderResult()

    expect(screen.getByLabelText('Advanced search answer')).toHaveTextContent('Ada is active.')
    expect(screen.getByText('Ranked evidence')).toBeInTheDocument()
    expect(screen.getByText('Context-only entries')).toBeInTheDocument()
    expect(screen.getByText('Customers > Active')).toBeInTheDocument()
    expect(screen.getByText('2 → 2')).toBeInTheDocument()
    expect(screen.getByText('Excerpt not included')).toBeInTheDocument()
    expect(screen.getAllByText('Graph fact fact-1').length).toBeGreaterThan(0)
    expect(screen.getByText('Missing reference missing-citation')).toBeInTheDocument()
    expect(screen.getByText(/Result warnings/)).toBeInTheDocument()
    expect(screen.getByLabelText('Advanced search answer').querySelector('pre')).toHaveTextContent('Ada is active.')
    expect(screen.getByLabelText('Advanced search answer').querySelector('pre')).not.toHaveTextContent('Citation')
    expect(screen.getByRole('link', { name: 'Inspect chunk' })).toHaveAttribute('href', '/chunking?view=chunks&documentId=doc-1&chunkId=chunk-1')
  })

  it('renders explicit insufficient and unavailable answer states while retaining limitations', () => {
    const insufficient = structuredClone(baseResult)
    insufficient.answer.status = 'INSUFFICIENT_EVIDENCE'
    insufficient.answer.text = null
    insufficient.answer.limitations = [{ code: 'GAP', description: 'Coverage is incomplete.' }]
    insufficient.answerDiagnostics.abstained = true

    renderResult(insufficient)

    expect(screen.getByText('Insufficient evidence')).toBeInTheDocument()
    expect(screen.getByText(/Coverage is incomplete/)).toBeInTheDocument()
    expect(screen.queryByText('Answer unavailable')).not.toBeInTheDocument()
  })

  it('keeps partial branch content visible and distinguishes an unavailable answer', () => {
    renderResult(baseResult, documents, 'PARTIAL')
    expect(screen.getByText('Partial result')).toBeInTheDocument()

    const unavailable = structuredClone(baseResult)
    unavailable.answer.status = 'UNAVAILABLE'
    unavailable.answer.text = null
    unavailable.answer.claims = []
    renderResult(unavailable, documents, 'COMPLETED')
    expect(screen.getByText('Answer unavailable')).toBeInTheDocument()
  })

  it('renders nullable branch attempts as cited results with retriever-labeled warnings', () => {
    const branchResult = structuredClone(baseResult)
    branchResult.diagnostics.attempts = [{
      roundNumber: 1,
      subqueryId: null,
      retriever: 'TEXT',
      status: 'FAILED',
      candidateCount: 0,
      latencyMs: 12,
      failureCategory: 'TIMEOUT',
    }]

    renderResult(branchResult)

    expect(screen.getByTestId('advanced-search-cited-result')).toBeInTheDocument()
    expect(screen.queryByTestId('advanced-search-result-failure')).not.toBeInTheDocument()
    expect(screen.getByText(/Retriever attempt TEXT branch reported FAILED\./)).toBeInTheDocument()
  })

  it('uses snapshot label, cached filename, and document ID fallbacks without requiring document lookup', () => {
    const snapshot = { ...baseResult.evidence[0], sourceDisplayLabel: 'Snapshot label' }
    expect(resolveAdvancedSearchSourceLabel(snapshot, documents)).toBe('Snapshot label')
    expect(resolveAdvancedSearchSourceLabel({ ...snapshot, sourceDisplayLabel: null, sourceFilename: 'legacy.txt' }, documents)).toBe('legacy.txt')
    expect(resolveAdvancedSearchSourceLabel({ ...snapshot, sourceDisplayLabel: null, sourceFilename: null }, documents)).toBe('cached-document.md')
    expect(resolveAdvancedSearchSourceLabel({ ...snapshot, sourceDisplayLabel: null, sourceFilename: null, documentId: 'missing-doc' }, [])).toBe('missing-doc')
    expect(chunkExplorerHref({ ...snapshot, chunkId: null })).toBeNull()
  })

  it('keeps operator diagnostics collapsed and preserves complete raw JSON for invalid results', () => {
    renderResult()

    const diagnosticsSection = screen.getByRole('region', { name: 'Advanced search diagnostics' })
    expect(within(diagnosticsSection).getByText('Planning diagnostics').closest('details')).not.toHaveAttribute('open')
    expect(within(diagnosticsSection).getByText('Raw result JSON').closest('details')).not.toHaveAttribute('open')

    render(
      <MemoryRouter>
        <AdvancedSearchResultPanel
          parsed={{ kind: 'UNSUPPORTED_VERSION', reason: 'Payload version 2 is not supported', payloadVersion: 2, raw: { payloadVersion: 2, retained: true } }}
          runStatus='COMPLETED'
          documents={[]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Unsupported advanced-search result')).toBeInTheDocument()
    const raw = screen.getAllByText('Raw result JSON').at(-1)?.closest('details')
    expect(raw).not.toHaveAttribute('open')
    expect(raw).toHaveTextContent('retained')
  })

  it('renders malformed supported-version results without semantic content', () => {
    render(
      <MemoryRouter>
        <AdvancedSearchResultPanel
          parsed={{ kind: 'MALFORMED', reason: 'Answer claims are malformed', issues: ['answer.claims: Required'], raw: { payloadVersion: 1, answer: null } }}
          runStatus='COMPLETED'
          documents={[]}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('Malformed advanced-search result')).toBeInTheDocument()
    expect(screen.queryByText('Ranked evidence')).not.toBeInTheDocument()
    expect(screen.getByText('Raw result JSON')).toBeInTheDocument()
  })
})
