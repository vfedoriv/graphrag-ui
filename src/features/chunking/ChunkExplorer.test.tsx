import { fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChunkExplorer } from './ChunkExplorer'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'

const documentFixture = {
  id: 'doc-1',
  knowledgeBaseId: 'kb-a',
  originalFilename: 'report.txt',
  contentType: 'text/plain',
  sizeBytes: 10,
  sha256: 'doc-hash',
  contentUri: 'memory://report.txt',
  status: 'COMPLETED',
  uploadedAt: '',
  processedAt: '',
  errorMessage: null,
}

const parentFixture = {
  id: 'parent-1',
  documentId: 'doc-1',
  chunkIndex: 0,
  text: 'parent text',
  tokenEstimate: 100,
  kind: 'PARENT',
  childCount: 1,
  pageStart: 1,
  pageEnd: 2,
  sourceStart: 0,
  sourceEnd: 100,
  sectionIndex: 2,
  sectionChunkIndex: 0,
  structuralPath: '2/0',
  chunkStrategyRevision: 'strategy-v1',
  effectiveChunkerRevision: 'chunker-v1',
  representationRevision: 'representation-v1',
  metadata: null,
}

const childFixture = {
  id: 'child-1',
  documentId: 'doc-1',
  chunkIndex: 1,
  text: 'authoritative child text',
  tokenEstimate: 12,
  kind: 'CHILD',
  parentChunkId: 'parent-1',
  childIndex: 0,
  childCount: 1,
  processingRunId: 'run-1',
  sectionIndex: 2,
  sectionChunkIndex: 1,
  sourceStart: 101,
  sourceEnd: 140,
  pageStart: 2,
  pageEnd: 2,
  structuralPath: '2/0/1',
  blockConfidence: '0.98',
  chunkSettingsHash: 'settings-hash',
  chunkStrategyRevision: 'strategy-v1',
  effectiveChunkerRevision: 'chunker-v1',
  tokenizerId: 'tokenizer-v1',
  representationRevision: 'representation-v1',
  sourceHash: 'source-hash',
  metadata: '{"source":"report.txt","parser":"test"}',
}

function renderExplorer(initialEntry = '/chunking?view=chunks') {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ChunkExplorer tabs={null} activeKb='KB A' />
    </MemoryRouter>,
    { selectedKnowledgeBaseId: 'kb-a' },
  )
}

function baseFetch(extra: (url: string) => ReturnType<typeof jsonResponse> | undefined) {
  return stubFetch((url) => {
    if (url.endsWith('/knowledge-bases/kb-a/documents')) return jsonResponse(200, [documentFixture])
    return extra(url) ?? jsonResponse(404, { detail: `Unexpected request: ${url}` })
  })
}

function KnowledgeBaseChangeButton() {
  const { setSelectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  return <button type='button' onClick={() => setSelectedKnowledgeBaseId('kb-b')}>Change knowledge base</button>
}

describe('ChunkExplorer', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('loads bounded hierarchy and direct detail without requesting the complete-list route', async () => {
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [parentFixture], flatChunkCount: 0 })
      }
      if (url.endsWith('/documents/doc-1/chunks/parent-1')) return jsonResponse(200, parentFixture)
      return undefined
    })

    renderExplorer('/chunking?view=chunks&documentId=doc-1')

    expect(await screen.findByText('parent-1')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 1 · 1 total')).toBeInTheDocument()
    expect(screen.queryByText('parent text')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Select chunk parent-1' }))

    expect(await screen.findByText('parent text')).toBeInTheDocument()
    expect(screen.getByText('Authoritative text')).toBeInTheDocument()
    expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0)
    expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-1\/chunks$/.test(String(url)))).toBe(false)
  })

  it('expands a parent with an independent child page and selects the child directly', async () => {
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [parentFixture], flatChunkCount: 0 })
      }
      if (url.endsWith('/documents/doc-1/chunks/page?page=0&size=20&kind=CHILD&parentChunkId=parent-1')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [childFixture] })
      }
      if (url.endsWith('/documents/doc-1/chunks/child-1')) return jsonResponse(200, childFixture)
      return undefined
    })

    renderExplorer('/chunking?view=chunks&documentId=doc-1')
    await screen.findByText('parent-1')
    await fireEvent.click(screen.getByRole('button', { name: 'Expand parent parent-1' }))

    const children = await screen.findByTestId('chunk-children-parent-1')
    expect(await within(children).findByText('child-1')).toBeInTheDocument()
    await fireEvent.click(within(children).getByRole('button', { name: 'Select chunk child-1' }))

    expect(await screen.findByText('authoritative child text')).toBeInTheDocument()
    expect(screen.getByText('settings-hash')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/chunks/page')).length).toBe(1)
  })

  it('keeps a child branch independent when its page fails', async () => {
    baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [parentFixture], flatChunkCount: 0 })
      }
      if (url.endsWith('/documents/doc-1/chunks/page?page=0&size=20&kind=CHILD&parentChunkId=parent-1')) {
        return jsonResponse(503, { detail: 'Child branch unavailable' })
      }
      return undefined
    })

    renderExplorer('/chunking?view=chunks&documentId=doc-1')
    await screen.findByText('parent-1')
    await fireEvent.click(screen.getByRole('button', { name: 'Expand parent parent-1' }))
    expect(await screen.findByText('Child branch unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry children' })).toBeInTheDocument()
  })

  it('pages flat fallback chunks and exposes mixed parent and flat populations', async () => {
    const flatChunk = { ...childFixture, id: 'flat-1', kind: 'FLAT', parentChunkId: null, text: 'flat text', childIndex: null }
    baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [parentFixture], flatChunkCount: 1 })
      }
      if (url.endsWith('/documents/doc-1/chunks/page?page=0&size=20&kind=FLAT')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [flatChunk] })
      }
      if (url.endsWith('/documents/doc-1/chunks/flat-1')) return jsonResponse(200, flatChunk)
      return undefined
    })

    renderExplorer('/chunking?view=chunks&documentId=doc-1')

    expect(await screen.findByText('parent-1')).toBeInTheDocument()
    expect(await screen.findByText('flat-1')).toBeInTheDocument()
    expect(screen.getByText('Flat population')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Select chunk flat-1' }))
    expect(await screen.findByText('flat text')).toBeInTheDocument()
  })

  it('resolves a deep-linked child directly, reveals its parent, and loads one bounded child page', async () => {
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 10, content: [], flatChunkCount: 0 })
      }
      if (url.endsWith('/documents/doc-1/chunks/child-1')) return jsonResponse(200, childFixture)
      if (url.endsWith('/documents/doc-1/chunks/parent-1')) return jsonResponse(200, parentFixture)
      if (url.endsWith('/documents/doc-1/chunks/page?page=0&size=20&kind=CHILD&parentChunkId=parent-1')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [childFixture] })
      }
      return undefined
    })

    renderExplorer('/chunking?view=chunks&documentId=doc-1&chunkId=child-1')

    expect(await screen.findByText('authoritative child text')).toBeInTheDocument()
    expect(await screen.findByText(/off the current page/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Select chunk child-1' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/chunks'))).toBe(false)
  })

  it('shows explicit lifecycle states and direct error feedback', async () => {
    const unprocessed = { ...documentFixture, status: 'UPLOADED' }
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) return jsonResponse(200, [unprocessed])
      return jsonResponse(404, { detail: 'unexpected' })
    })
    const firstRender = renderExplorer('/chunking?view=chunks&documentId=doc-1')
    expect(await screen.findByText('Document has not been processed')).toBeInTheDocument()
    firstRender.unmount()

    vi.unstubAllGlobals()
    baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 0 })
      }
      if (url.endsWith('/documents/doc-1/chunks/missing')) return jsonResponse(404, { detail: 'not found' })
      return undefined
    })
    renderExplorer('/chunking?view=chunks&documentId=doc-1&chunkId=missing')
    expect(await screen.findByText(/The selected chunk was not found in this document/)).toBeInTheDocument()
  })

  it('clears invalid ownership and selections when the knowledge base changes', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases/kb-a/documents')) return jsonResponse(200, [documentFixture])
      if (url.endsWith('/knowledge-bases/kb-b/documents')) return jsonResponse(200, [])
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 0 })
      }
      return undefined
    })

    renderWithProviders(
      <MemoryRouter initialEntries={['/chunking?view=chunks&documentId=missing'] }>
        <KnowledgeBaseChangeButton />
        <ChunkExplorer tabs={null} activeKb='KB A' />
      </MemoryRouter>,
      { selectedKnowledgeBaseId: 'kb-a' },
    )

    expect(await screen.findByText(/not available in the selected knowledge base/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Change knowledge base' }))
    expect(await screen.findByText(/knowledge base changed/)).toBeInTheDocument()
    expect(await screen.findByText('No documents available')).toBeInTheDocument()
  })
})
