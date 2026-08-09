import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  useDocumentChunkHierarchyQuery,
  useDocumentChunkPageQuery,
  useDocumentChunkQuery,
  useDocumentsQuery,
} from '../../api/documents'
import { queryKeys } from '../../api/queryKeys'
import { ApiError, type DocumentChunk, type DocumentChunkHierarchy, type DocumentChunkSummary } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { isCompletedOrSuccessfullyProcessed } from '../documents/documentStatus'
import { CHUNK_EXPLORER_PAGE_SIZE, readChunkExplorerSelection } from './chunkExplorerState'

type ChunkExplorerMode = 'EMPTY' | 'FLAT' | 'HIERARCHICAL'

const DOCUMENT_TOPOLOGY_CONFLICT_DETAIL = 'Document chunk topology is invalid'

export function ChunkExplorer({ tabs, activeKb }: { tabs: ReactNode; activeKb: string | null }) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const documentsQuery = useDocumentsQuery(selectedKnowledgeBaseId)
  const { documentId, chunkId } = useMemo(
    () => readChunkExplorerSelection(location.search),
    [location.search],
  )
  const documents = documentsQuery.data ?? []
  const selectedDocument = documents.find((document) => document.id === documentId) ?? null
  const [hierarchyPage, setHierarchyPage] = useState(0)
  const [flatPage, setFlatPage] = useState(0)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const previousKnowledgeBaseId = useRef(selectedKnowledgeBaseId)
  const [flatPageWasManuallyChanged, setFlatPageWasManuallyChanged] = useState(false)
  const notice = readChunkExplorerNotice(location.state)

  const updateSelection = useCallback(
    (nextDocumentId: string | null, nextChunkId: string | null, nextNotice?: string) => {
      const params = new URLSearchParams(location.search)
      params.set('view', 'chunks')
      if (nextDocumentId) params.set('documentId', nextDocumentId)
      else params.delete('documentId')
      if (nextChunkId) params.set('chunkId', nextChunkId)
      else params.delete('chunkId')
      navigate(`/chunking?${params.toString()}`, {
        replace: true,
        state: nextNotice ? { chunkExplorerNotice: nextNotice } : null,
      })
    },
    [location.search, navigate],
  )

  useEffect(() => {
    const previousId = previousKnowledgeBaseId.current
    if (previousId === selectedKnowledgeBaseId) return

    previousKnowledgeBaseId.current = selectedKnowledgeBaseId
    if (documentId) {
      queryClient.removeQueries({ queryKey: queryKeys.chunks(documentId) })
    }
    updateSelection(null, null, 'The knowledge base changed, so the previous document and chunk selection was cleared.')
  }, [documentId, queryClient, selectedKnowledgeBaseId, updateSelection])

  useEffect(() => {
    if (!documentId || documentsQuery.isLoading || documentsQuery.error || !documentsQuery.data) return
    if (selectedDocument) return

    updateSelection(null, null, 'That document is not available in the selected knowledge base, so its URL selection was cleared.')
  }, [documentId, documentsQuery.data, documentsQuery.error, documentsQuery.isLoading, selectedDocument, updateSelection])

  const processedDocumentId = selectedDocument && isCompletedOrSuccessfullyProcessed(selectedDocument.status)
    ? selectedDocument.id
    : null
  const directQuery = useDocumentChunkQuery(processedDocumentId, chunkId)
  const directChunk = directQuery.data
  const effectiveFlatPage = !flatPageWasManuallyChanged && directChunk && !directChunk.parentChunkId && !isParentChunk(directChunk) && directChunk.chunkIndex >= 0
    ? Math.floor(directChunk.chunkIndex / CHUNK_EXPLORER_PAGE_SIZE)
    : flatPage
  const hierarchyQuery = useDocumentChunkHierarchyQuery(processedDocumentId, hierarchyPage, CHUNK_EXPLORER_PAGE_SIZE)
  const topologyConflict = isDocumentTopologyConflict(hierarchyQuery.error)
  const hierarchyData = hierarchyQuery.isFetching ? undefined : hierarchyQuery.data
  const chunkExplorerMode = topologyConflict ? null : deriveChunkExplorerMode(hierarchyData)
  const flatChunkCount = hierarchyData?.flatChunkCount ?? 0
  const flatQuery = useDocumentChunkPageQuery(
    processedDocumentId,
    effectiveFlatPage,
    CHUNK_EXPLORER_PAGE_SIZE,
    { kind: 'FLAT' },
    { enabled: chunkExplorerMode === 'FLAT' },
  )
  const parentDirectQuery = useDocumentChunkQuery(processedDocumentId, directChunk?.parentChunkId ?? null)
  const flatPageData = flatQuery.isFetching ? undefined : flatQuery.data
  const hierarchyLoading = hierarchyQuery.isPending || hierarchyQuery.isFetching
  const flatLoading = flatQuery.isPending || flatQuery.isFetching

  useEffect(() => {
    if (!(directQuery.error instanceof ApiError) || directQuery.error.status !== 404 || !chunkId || !documentId) return

    updateSelection(documentId, null, 'The selected chunk was not found in this document. The stale chunk selection was cleared without changing the knowledge base.')
  }, [chunkId, directQuery.error, documentId, updateSelection])

  const hierarchyParents = useMemo(
    () => chunkExplorerMode === 'HIERARCHICAL' ? hierarchyData?.content ?? [] : [],
    [chunkExplorerMode, hierarchyData],
  )
  const effectiveExpandedParents = useMemo(() => {
    if (!directChunk?.parentChunkId) return expandedParents
    const next = new Set(expandedParents)
    next.add(directChunk.parentChunkId)
    return next
  }, [directChunk, expandedParents])
  const syntheticParent = chunkExplorerMode === 'HIERARCHICAL' && parentDirectQuery.data && directChunk?.parentChunkId && !hierarchyParents.some((parent) => parent.id === directChunk.parentChunkId)
    ? parentDirectQuery.data
    : null
  const visibleParents = useMemo(
    () => syntheticParent ? [...hierarchyParents, syntheticParent] : hierarchyParents,
    [hierarchyParents, syntheticParent],
  )

  const selectDocument = (nextDocumentId: string) => {
    setHierarchyPage(0)
    setFlatPage(0)
    setExpandedParents(new Set())
    setFlatPageWasManuallyChanged(false)
    updateSelection(nextDocumentId, null)
  }

  const selectChunk = (nextChunkId: string) => {
    setFlatPageWasManuallyChanged(false)
    updateSelection(documentId, nextChunkId)
  }

  const toggleParent = (parentId: string) => {
    setExpandedParents((current) => {
      const next = new Set(current)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  const content = !selectedKnowledgeBaseId ? (
    <Alert title='No knowledge base selected' message='Select a knowledge base before inspecting document chunks.' tone='info' />
  ) : documentsQuery.isLoading ? (
    <p>Loading documents for the selected knowledge base...</p>
  ) : documentsQuery.error ? (
    <Alert title='Documents unavailable' message={(documentsQuery.error as Error).message} />
  ) : documents.length === 0 ? (
    <div className='stack'>
      {notice ? <Alert title='Chunk Explorer notice' message={notice} tone='info' /> : null}
      <EmptyState title='No documents available' body='Upload and process a document from Documents before opening the Chunk Explorer.' />
    </div>
  ) : (
    <div className='stack-lg'>
      <section className='flow-card stack'>
        <div className='split-stack'>
          <div>
            <p className='eyebrow'>Document selection</p>
            <h3>Choose a processed document</h3>
          </div>
          <StatusBadge label={`${documents.length} available`} tone='neutral' />
        </div>
        <label htmlFor='chunk-explorer-document'>Document</label>
        <select
          id='chunk-explorer-document'
          aria-label='Document to inspect'
          value={documentId ?? ''}
          onChange={(event) => selectDocument(event.target.value)}
        >
          <option value=''>Select a document</option>
          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.originalFilename} · {document.status}
            </option>
          ))}
        </select>
        {!documentId ? <p>Select a document to load bounded chunk summaries.</p> : null}
        {notice ? <Alert title='Chunk Explorer notice' message={notice} tone='info' /> : null}
      </section>

      {selectedDocument && !isCompletedOrSuccessfullyProcessed(selectedDocument.status) ? (
        <div className='stack'>
          <Alert
            title='Document has not been processed'
            message={`This document is ${selectedDocument.status}. Process it from Documents before inspecting chunk output.`}
            tone='info'
          />
          <Link className='button' to='/documents'>Open Documents</Link>
        </div>
      ) : null}

      {selectedDocument && processedDocumentId ? (
        <>
          <OperationSpine
            ariaLabel='Chunk Explorer status'
            items={[
              { eyebrow: 'Document', title: selectedDocument.originalFilename, body: selectedDocument.id },
              { eyebrow: 'Topology', title: topologyConflict ? 'Integrity conflict' : hierarchyLoading ? 'Loading' : formatModeLabel(chunkExplorerMode), body: 'One bounded document outline' },
              { eyebrow: 'Selection', title: directChunk ? directChunk.id : chunkId ?? 'None', body: 'Direct authoritative lookup' },
            ]}
          />
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]' data-testid='chunk-explorer-layout'>
            <section className='flow-card stack' aria-label='Chunk outline'>
              <div className='panel-head compact'>
                <div>
                  <p className='eyebrow'>Bounded outline</p>
                  <h3>{topologyConflict ? 'Document integrity' : formatModeHeading(chunkExplorerMode)}</h3>
                </div>
                <StatusBadge label={formatModeStatus(chunkExplorerMode, hierarchyData?.totalElements ?? 0, flatChunkCount, hierarchyLoading, topologyConflict)} tone={topologyConflict ? 'warning' : 'neutral'} />
              </div>
              {hierarchyLoading ? <p>Loading document topology...</p> : null}
              {topologyConflict ? (
                <div className='stack'>
                  <Alert
                    title='Document integrity error'
                    message={`${DOCUMENT_TOPOLOGY_CONFLICT_DETAIL}. Collection navigation is disabled until the document is repaired.`}
                  />
                  <Button type='button' variant='ghost' onClick={() => void hierarchyQuery.refetch()}>Retry hierarchy check</Button>
                </div>
              ) : hierarchyQuery.error ? (
                <div className='stack'>
                  <Alert title='Hierarchy page failed' message={(hierarchyQuery.error as Error).message} />
                  <Button type='button' variant='ghost' onClick={() => void hierarchyQuery.refetch()}>Retry hierarchy page</Button>
                </div>
              ) : null}
              {!hierarchyLoading && !hierarchyQuery.error && chunkExplorerMode === 'EMPTY' ? (
                <EmptyState title='No chunks available' body='This processed document has no chunk output.' />
              ) : null}
              {!hierarchyLoading && !hierarchyQuery.error && chunkExplorerMode === 'HIERARCHICAL' && hierarchyParents.length === 0 && (hierarchyData?.totalElements ?? 0) > 0 ? (
                <EmptyState title='No parent summaries on this page' body='Use the bounded hierarchy controls to reveal another page.' />
              ) : null}
              {chunkExplorerMode === 'HIERARCHICAL' && visibleParents.length > 0 ? (
                <div className='stack' data-testid='chunk-parent-outline'>
                  {visibleParents.map((parent) => (
                    <ChunkParentBranch
                      key={`${parent.id}-${directChunk?.parentChunkId === parent.id ? directChunk.childIndex ?? 0 : 0}`}
                      parent={parent}
                      documentId={processedDocumentId}
                      isExpanded={effectiveExpandedParents.has(parent.id)}
                      isSelected={directChunk?.id === parent.id}
                      selectedChunkId={directChunk?.id ?? null}
                      initialPage={directChunk?.parentChunkId === parent.id && directChunk.childIndex != null ? Math.floor(directChunk.childIndex / CHUNK_EXPLORER_PAGE_SIZE) : 0}
                      onToggle={() => toggleParent(parent.id)}
                      onSelect={() => selectChunk(parent.id)}
                      onSelectChild={selectChunk}
                    />
                  ))}
                </div>
              ) : null}
              {chunkExplorerMode === 'HIERARCHICAL' && hierarchyData && hierarchyData.totalElements > 0 ? (
                <PageControls
                  page={hierarchyPage}
                  size={CHUNK_EXPLORER_PAGE_SIZE}
                  total={hierarchyData.totalElements}
                  onPageChange={setHierarchyPage}
                  label='Hierarchy pages'
                />
              ) : null}
              {chunkExplorerMode === 'FLAT' && flatChunkCount > 0 ? (
                <section className='stack' aria-label='Flat chunk outline'>
                  <div className='panel-head compact'>
                    <div>
                      <p className='eyebrow'>Flat document</p>
                      <h4>Flat chunks</h4>
                    </div>
                    <StatusBadge label={`${flatChunkCount} total`} tone='neutral' />
                  </div>
                  {flatLoading ? <p>Loading flat chunk page...</p> : null}
                  {flatQuery.error ? (
                    <div className='stack'>
                      <Alert title='Flat chunk page failed' message={(flatQuery.error as Error).message} />
                      <Button type='button' variant='ghost' onClick={() => void flatQuery.refetch()}>Retry flat page</Button>
                    </div>
                  ) : null}
                  {!flatLoading && !flatQuery.error && (flatPageData?.content.length ?? 0) === 0 ? (
                    <EmptyState title='No flat chunks on this page' body='Try another bounded flat page.' />
                  ) : null}
                  {flatPageData?.content.map((chunk) => (
                    <ChunkOutlineRow key={chunk.id} chunk={chunk} isSelected={directChunk?.id === chunk.id} onSelect={() => selectChunk(chunk.id)} />
                  ))}
                  <PageControls
                  page={effectiveFlatPage}
                  size={CHUNK_EXPLORER_PAGE_SIZE}
                  total={flatPageData?.totalElements ?? flatChunkCount}
                    onPageChange={(nextPage) => {
                      setFlatPageWasManuallyChanged(true)
                      setFlatPage(nextPage)
                    }}
                    label='Flat chunk pages'
                  />
                </section>
              ) : null}
            </section>
            <ChunkDetailPane
              chunkId={chunkId}
              chunk={directChunk}
              isLoading={directQuery.isLoading}
              error={directQuery.error}
              onRetry={() => void directQuery.refetch()}
            />
          </div>
          {directChunk?.parentChunkId && !parentDirectQuery.data && parentDirectQuery.error ? (
            <Alert title='Parent reveal unavailable' message='The selected child is loaded directly, but its parent could not be resolved. Use the paged hierarchy to continue navigation.' tone='info' />
          ) : null}
          {directChunk?.parentChunkId && syntheticParent ? (
            <Alert title='Selected parent is off the current page' message='The child detail remains selected. Its parent was revealed with one bounded direct lookup; hierarchy navigation was not scanned.' tone='info' />
          ) : null}
          {chunkExplorerMode === 'FLAT' && directChunk && !directChunk.parentChunkId && !isParentChunk(directChunk) ? (
            <Alert title='Flat chunk reveal' message={`The selected flat chunk is on bounded flat page ${Math.floor(directChunk.chunkIndex / CHUNK_EXPLORER_PAGE_SIZE) + 1} when its position is available.`} tone='info' />
          ) : null}
        </>
      ) : null}
    </div>
  )

  return (
    <ControllerPage
      title='Chunk Explorer'
      eyebrow='Knowledge-base operations workspace'
      description='Browse bounded chunk summaries and inspect one authoritative chunk at a time without materializing a complete document.'
      workspaceStrip={<WorkspaceStrip items={[{ label: 'Scope', value: activeKb ?? selectedKnowledgeBaseId ?? 'None selected' }, { label: 'Reads', value: 'Hierarchy · page · direct' }]} />}
      topSectionTitle='Chunk inspection'
      topSectionDescription='Document choices and chunk selections remain scoped to the globally selected knowledge base.'
      topSectionStatus={<StatusBadge label={selectedDocument ? 'Document selected' : 'Waiting for document'} tone={selectedDocument ? 'success' : 'warning'} />}
      topSection={content}
      tabs={tabs}
      tabsTitle='Chunking workspace'
      tabsDescription='Strategy is global; Chunk Explorer is scoped to the selected knowledge base.'
      testId='chunk-explorer'
    />
  )
}

function ChunkParentBranch({
  parent,
  documentId,
  isExpanded,
  isSelected,
  selectedChunkId,
  initialPage,
  onToggle,
  onSelect,
  onSelectChild,
}: {
  parent: DocumentChunkSummary
  documentId: string
  isExpanded: boolean
  isSelected: boolean
  selectedChunkId: string | null
  initialPage: number
  onToggle: () => void
  onSelect: () => void
  onSelectChild: (chunkId: string) => void
}) {
  const [page, setPage] = useState(initialPage)
  const childQuery = useDocumentChunkPageQuery(
    documentId,
    page,
    CHUNK_EXPLORER_PAGE_SIZE,
    { kind: 'CHILD', parentChunkId: parent.id },
    { enabled: isExpanded },
  )
  const childPageData = childQuery.isFetching ? undefined : childQuery.data
  const childLoading = childQuery.isPending || childQuery.isFetching

  return (
    <article className='stack' data-testid={`chunk-parent-${parent.id}`}>
      <div className='flow-card stack'>
        <div className='split-stack'>
          <Button type='button' variant='ghost' aria-expanded={isExpanded} aria-label={`${isExpanded ? 'Collapse' : 'Expand'} parent ${parent.id}`} onClick={onToggle}>
            {isExpanded ? '▾' : '▸'}
          </Button>
          <ChunkOutlineRow chunk={parent} isSelected={isSelected} onSelect={onSelect} />
        </div>
        {isExpanded ? (
          <div className='stack pl-6' data-testid={`chunk-children-${parent.id}`}>
            {childLoading ? <p>Loading children...</p> : null}
            {childQuery.error ? (
              <div className='stack'>
                <Alert title='Child page failed' message={(childQuery.error as Error).message} />
                <Button type='button' variant='ghost' onClick={() => void childQuery.refetch()}>Retry children</Button>
              </div>
            ) : null}
            {!childLoading && !childQuery.error && (childPageData?.content.length ?? 0) === 0 ? (
              <EmptyState title='No children on this page' body='This parent remains visible. Try another child page or retry the branch.' />
            ) : null}
            {childPageData?.content.map((child) => (
              <ChunkOutlineRow key={child.id} chunk={child} isSelected={selectedChunkId === child.id} onSelect={() => onSelectChild(child.id)} />
            ))}
            <PageControls
              page={page}
              size={CHUNK_EXPLORER_PAGE_SIZE}
              total={childPageData?.totalElements ?? 0}
              onPageChange={setPage}
              label={`Children of ${parent.id}`}
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}

function ChunkOutlineRow({ chunk, isSelected, onSelect }: { chunk: DocumentChunkSummary; isSelected: boolean; onSelect: () => void }) {
  return (
    <button type='button' className={`w-full text-left ${isSelected ? 'ring-2 ring-slate-500' : ''}`} aria-label={`Select chunk ${chunk.id}`} onClick={onSelect}>
      <div className='split-stack'>
        <div>
          <strong>{chunk.kind ?? 'Chunk'} · {chunk.chunkIndex}</strong>
          <small className='break-anywhere'>{chunk.id}</small>
        </div>
        <StatusBadge label={`${chunk.tokenEstimate} tokens`} tone='neutral' />
      </div>
      <dl className='grid gap-1 sm:grid-cols-2'>
        <SummaryField label='Pages' value={formatRange(chunk.pageStart, chunk.pageEnd)} />
        <SummaryField label='Source' value={formatRange(chunk.sourceStart, chunk.sourceEnd)} />
        <SummaryField label='Section' value={formatSection(chunk.sectionIndex, chunk.sectionChunkIndex)} />
        <SummaryField label='Path' value={chunk.structuralPath} />
        <SummaryField label='Children' value={chunk.childCount} />
        <SummaryField label='Strategy revision' value={chunk.chunkStrategyRevision} />
        <SummaryField label='Effective revision' value={chunk.effectiveChunkerRevision} />
      </dl>
    </button>
  )
}

function SummaryField({ label, value }: { label: string; value: unknown }) {
  return <div><dt className='font-semibold'>{label}</dt><dd className='break-anywhere muted'>{formatUnavailable(value)}</dd></div>
}

function ChunkDetailPane({
  chunkId,
  chunk,
  isLoading,
  error,
  onRetry,
}: {
  chunkId: string | null
  chunk?: DocumentChunk
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}) {
  return (
    <aside className='flow-card stack' aria-label='Selected chunk detail' data-testid='chunk-detail'>
      <div className='panel-head compact'>
        <div>
          <p className='eyebrow'>Direct detail</p>
          <h3>{chunk ? `Chunk ${chunk.chunkIndex}` : 'Selected chunk'}</h3>
        </div>
        <StatusBadge label={chunk ? 'Authoritative' : 'Waiting'} tone={chunk ? 'success' : 'neutral'} />
      </div>
      {!chunkId ? <EmptyState title='No chunk selected' body='Select a parent, child, or flat outline row to load full text and provenance.' /> : null}
      {isLoading ? <p>Loading selected chunk...</p> : null}
      {error ? (
        <div className='stack'>
          <Alert title={error instanceof ApiError && error.status === 404 ? 'Chunk not found' : 'Selected chunk failed'} message={formatDirectError(error)} />
          <Button type='button' variant='ghost' onClick={onRetry}>Retry direct lookup</Button>
        </div>
      ) : null}
      {chunk ? <ChunkDetail chunk={chunk} /> : null}
    </aside>
  )
}

function ChunkDetail({ chunk }: { chunk: DocumentChunk }) {
  const fields: Array<[string, unknown]> = [
    ['Chunk ID', chunk.id],
    ['Document ID', chunk.documentId],
    ['Kind', chunk.kind],
    ['Parent chunk ID', chunk.parentChunkId],
    ['Child index', chunk.childIndex],
    ['Child count', chunk.childCount],
    ['Processing run', chunk.processingRunId],
    ['Section', formatSection(chunk.sectionIndex, chunk.sectionChunkIndex)],
    ['Source offsets', formatRange(chunk.sourceStart, chunk.sourceEnd)],
    ['Source pages', formatRange(chunk.pageStart, chunk.pageEnd)],
    ['Structural path', chunk.structuralPath],
    ['Block confidence', chunk.blockConfidence],
    ['Chunk settings hash', chunk.chunkSettingsHash],
    ['Chunk strategy revision', chunk.chunkStrategyRevision],
    ['Effective chunker revision', chunk.effectiveChunkerRevision],
    ['Tokenizer', chunk.tokenizerId],
    ['Representation revision', chunk.representationRevision],
    ['Source hash', chunk.sourceHash],
  ]

  return (
    <div className='stack'>
      <div className='split-stack'>
        <span className='eyebrow'>Token estimate</span>
        <StatusBadge label={`${chunk.tokenEstimate} tokens`} tone='neutral' />
      </div>
      <div className='stack'>
        <p className='field-label'>Authoritative text</p>
        <div className='output compact whitespace-pre-wrap'>{chunk.text}</div>
      </div>
      <dl className='grid gap-2 sm:grid-cols-[auto_1fr]'>
        {fields.map(([label, value]) => <SummaryField key={label} label={label} value={value} />)}
      </dl>
      <div className='stack'>
        <p className='field-label'>Raw metadata</p>
        <pre className='output compact whitespace-pre-wrap break-anywhere'>{formatRawMetadata(chunk.metadata)}</pre>
      </div>
    </div>
  )
}

function PageControls({ page, size, total, onPageChange, label }: { page: number; size: number; total: number; onPageChange: (page: number) => void; label: string }) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  return (
    <nav className='split-stack' aria-label={label}>
      <small>Page {page + 1} of {totalPages} · {total} total</small>
      <div className='toolbar'>
        <Button type='button' variant='ghost' disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>Previous page</Button>
        <Button type='button' variant='ghost' disabled={page >= totalPages - 1} onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}>Next page</Button>
      </div>
    </nav>
  )
}

function isParentChunk(chunk: DocumentChunk) {
  return chunk.kind?.toUpperCase() === 'PARENT'
}

function deriveChunkExplorerMode(hierarchy: DocumentChunkHierarchy | undefined): ChunkExplorerMode | null {
  if (!hierarchy) return null
  if (hierarchy.totalElements === 0 && hierarchy.flatChunkCount === 0) return 'EMPTY'
  if (hierarchy.totalElements === 0 && hierarchy.flatChunkCount > 0) return 'FLAT'
  if (hierarchy.totalElements > 0 && hierarchy.flatChunkCount === 0) return 'HIERARCHICAL'
  return null
}

function isDocumentTopologyConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409 && (
    error.problemDetail?.detail === DOCUMENT_TOPOLOGY_CONFLICT_DETAIL || error.message === DOCUMENT_TOPOLOGY_CONFLICT_DETAIL
  )
}

function formatModeLabel(mode: ChunkExplorerMode | null) {
  if (mode === 'EMPTY') return 'Empty'
  if (mode === 'FLAT') return 'Flat'
  if (mode === 'HIERARCHICAL') return 'Hierarchical'
  return 'Unavailable'
}

function formatModeHeading(mode: ChunkExplorerMode | null) {
  if (mode === 'EMPTY') return 'No chunk output'
  if (mode === 'FLAT') return 'Flat chunks'
  if (mode === 'HIERARCHICAL') return 'Hierarchy'
  return 'Document topology'
}

function formatModeStatus(
  mode: ChunkExplorerMode | null,
  parentTotal: number,
  flatChunkCount: number,
  isLoading: boolean,
  topologyConflict: boolean,
) {
  if (topologyConflict) return 'Integrity conflict'
  if (isLoading) return 'Loading topology'
  if (mode === 'EMPTY') return 'Empty document'
  if (mode === 'FLAT') return `${flatChunkCount} flat chunks`
  if (mode === 'HIERARCHICAL') return `${parentTotal} parent summaries`
  return 'Topology unavailable'
}

function formatRange(start: number | null | undefined, end: number | null | undefined) {
  if (start === null || start === undefined) return end === null || end === undefined ? 'Not recorded' : `Not recorded → ${end}`
  if (end === null || end === undefined) return `${start} → Not recorded`
  return `${start} → ${end}`
}

function formatSection(sectionIndex: number | null | undefined, sectionChunkIndex: number | null | undefined) {
  if (sectionIndex === null || sectionIndex === undefined) return 'Not recorded'
  return sectionChunkIndex === null || sectionChunkIndex === undefined
    ? String(sectionIndex)
    : `${sectionIndex} · chunk ${sectionChunkIndex}`
}

function formatUnavailable(value: unknown) {
  return value === null || value === undefined || value === '' ? 'Not recorded' : String(value)
}

function formatRawMetadata(value: string | null | undefined) {
  if (!value) return 'Not recorded'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function formatDirectError(error: Error) {
  if (error instanceof ApiError && error.status === 404) {
    return 'The selected chunk was not found in the selected document. It may be stale or owned by another knowledge base.'
  }
  return error.message
}

function readChunkExplorerNotice(state: unknown) {
  if (!state || typeof state !== 'object' || !('chunkExplorerNotice' in state)) return null
  const notice = state.chunkExplorerNotice
  return typeof notice === 'string' ? notice : null
}
