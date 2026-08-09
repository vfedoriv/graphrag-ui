import { fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChunkExplorer } from './ChunkExplorer'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { queryKeys } from '../../api/queryKeys'

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

const flatDocumentFixture = {
  ...documentFixture,
  id: 'doc-flat',
  originalFilename: 'fixed-character.txt',
}

const hierarchicalDocumentFixture = {
  ...documentFixture,
  id: 'doc-hierarchy',
  originalFilename: 'recursive-report.txt',
}

const emptyDocumentFixture = {
  ...documentFixture,
  id: 'doc-empty',
  originalFilename: 'empty.txt',
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

const flatChunkFixture = {
  ...childFixture,
  id: 'flat-1',
  documentId: 'doc-flat',
  parentChunkId: null,
  childIndex: null,
  text: 'fixed-character chunk text',
}

function renderExplorer(initialEntry = '/chunking?view=chunks') {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ChunkExplorer tabs={null} activeKb='KB A' />
    </MemoryRouter>,
    { selectedKnowledgeBaseId: 'kb-a' },
  )
}

function baseFetch(
  extra: (url: string) => ReturnType<typeof jsonResponse> | Promise<ReturnType<typeof jsonResponse>> | undefined,
  documents = [documentFixture],
) {
  return stubFetch((url) => {
    if (url.endsWith('/knowledge-bases/kb-a/documents')) return jsonResponse(200, documents)
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
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('kind=FLAT'))).toBe(false)
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

  it('pages a pure flat document with exact kind=FLAT requests and persisted CHILD records', async () => {
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-flat/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 1 })
      }
      if (url.endsWith('/documents/doc-flat/chunks/page?page=0&size=20&kind=FLAT')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [flatChunkFixture] })
      }
      if (url.endsWith('/documents/doc-flat/chunks/flat-1')) return jsonResponse(200, flatChunkFixture)
      return undefined
    }, [flatDocumentFixture])

    renderExplorer('/chunking?view=chunks&documentId=doc-flat')

    expect(await screen.findByText('flat-1')).toBeInTheDocument()
    expect(screen.getAllByText('Flat chunks').length).toBe(2)
    expect(screen.getByText('CHILD · 1')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/documents/doc-flat/chunks/page?page=0&size=20&kind=FLAT')).length).toBe(1)
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/documents/doc-flat/chunks/page?page=0&size=20&kind=CHILD'))).toBe(false)
    expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-flat\/chunks$/.test(String(url)))).toBe(false)
  })

  it('keeps a pure flat outline independent when its page fails and retries', async () => {
    let flatPageCalls = 0
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-flat/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 1 })
      }
      if (url.endsWith('/documents/doc-flat/chunks/page?page=0&size=20&kind=FLAT')) {
        flatPageCalls += 1
        return flatPageCalls === 1
          ? jsonResponse(503, { detail: 'Flat population unavailable' })
          : jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [flatChunkFixture] })
      }
      return undefined
    }, [flatDocumentFixture])

    renderExplorer('/chunking?view=chunks&documentId=doc-flat')

    expect(await screen.findByText('Flat population unavailable')).toBeInTheDocument()
    expect(screen.queryByText('parent-1')).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Retry flat page' }))
    expect(await screen.findByText('flat-1')).toBeInTheDocument()
    expect(flatPageCalls).toBe(2)
    expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-flat\/chunks$/.test(String(url)))).toBe(false)
  })

  it('selects an unparented child directly while its bounded flat page loads', async () => {
    let resolveFlatPage: ((response: ReturnType<typeof jsonResponse>) => void) | undefined
    const flatPage = new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
      resolveFlatPage = resolve
    })
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-flat/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 1 })
      }
      if (url.endsWith('/documents/doc-flat/chunks/page?page=0&size=20&kind=FLAT')) return flatPage
      if (url.endsWith('/documents/doc-flat/chunks/flat-1')) return jsonResponse(200, flatChunkFixture)
      return undefined
    }, [flatDocumentFixture])

    renderExplorer('/chunking?view=chunks&documentId=doc-flat&chunkId=flat-1')

    expect(await screen.findByText('fixed-character chunk text')).toBeInTheDocument()
    expect(screen.getByText('Loading flat chunk page...')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/chunks/flat-1'))).toBe(true)

    resolveFlatPage?.(jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [flatChunkFixture] }))
    expect(await screen.findByRole('button', { name: 'Select chunk flat-1' })).toBeInTheDocument()
    expect(screen.getByText('Kind')).toBeInTheDocument()
  })

  it('renders an empty topology without requesting a collection page', async () => {
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-empty/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 0 })
      }
      return undefined
    }, [emptyDocumentFixture])

    renderExplorer('/chunking?view=chunks&documentId=doc-empty')

    expect(await screen.findByText('No chunks available')).toBeInTheDocument()
    expect(screen.getByText('Empty document')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/chunks/page'))).toBe(false)
  })

  it('shows a topology conflict, suppresses collection navigation, and keeps direct detail visible', async () => {
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(409, { title: 'Conflict', detail: 'Document chunk topology is invalid' })
      }
      if (url.endsWith('/documents/doc-1/chunks/child-1')) return jsonResponse(200, childFixture)
      if (url.endsWith('/documents/doc-1/chunks/parent-1')) return jsonResponse(200, parentFixture)
      return undefined
    })

    renderExplorer('/chunking?view=chunks&documentId=doc-1&chunkId=child-1')

    expect(await screen.findByText('authoritative child text')).toBeInTheDocument()
    expect(await screen.findByText('Document integrity error')).toBeInTheDocument()
    expect(screen.getByText(/Document chunk topology is invalid/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry hierarchy check' })).toBeInTheDocument()
    expect(screen.queryByTestId('chunk-parent-outline')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/chunks/page'))).toBe(false)
    expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-1\/chunks$/.test(String(url)))).toBe(false)
  })

  it('replaces flat and hierarchical outlines without stale mode or page data', async () => {
    const hierarchyParent = { ...parentFixture, id: 'parent-hierarchy', documentId: 'doc-hierarchy' }
    const transitionFlatChunk = { ...flatChunkFixture, id: 'flat-transition' }
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-flat/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 1 })
      }
      if (url.endsWith('/documents/doc-flat/chunks/page?page=0&size=20&kind=FLAT')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [transitionFlatChunk] })
      }
      if (url.endsWith('/documents/doc-hierarchy/chunks/hierarchy?page=0&size=20')) {
        return jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [hierarchyParent], flatChunkCount: 0 })
      }
      return undefined
    }, [flatDocumentFixture, hierarchicalDocumentFixture])

    renderExplorer('/chunking?view=chunks&documentId=doc-flat')
    expect(await screen.findByText('flat-transition')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Document to inspect' }), { target: { value: 'doc-hierarchy' } })
    expect(await screen.findByText('parent-hierarchy')).toBeInTheDocument()
    expect(screen.queryByText('flat-transition')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/documents/doc-hierarchy/chunks/page'))).toBe(false)

    fireEvent.change(screen.getByRole('combobox', { name: 'Document to inspect' }), { target: { value: 'doc-flat' } })
    expect(await screen.findByText('flat-transition')).toBeInTheDocument()
    expect(screen.queryByText('parent-hierarchy')).not.toBeInTheDocument()
  })

  it('invalidates a replaced document without retaining the prior outline mode', async () => {
    let topology: 'FLAT' | 'HIERARCHICAL' = 'FLAT'
    const flatChunk = { ...flatChunkFixture, id: 'flat-replaced', documentId: 'doc-1' }
    const fetchMock = baseFetch((url) => {
      if (url.endsWith('/documents/doc-1/chunks/hierarchy?page=0&size=20')) {
        return topology === 'FLAT'
          ? jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [], flatChunkCount: 1 })
          : jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [parentFixture], flatChunkCount: 0 })
      }
      if (url.endsWith('/documents/doc-1/chunks/page?page=0&size=20&kind=FLAT')) {
        return topology === 'FLAT'
          ? jsonResponse(200, { page: 0, size: 20, totalElements: 1, content: [flatChunk] })
          : jsonResponse(200, { page: 0, size: 20, totalElements: 0, content: [] })
      }
      return undefined
    })

    const { queryClient } = renderExplorer('/chunking?view=chunks&documentId=doc-1')
    expect(await screen.findByText('flat-replaced')).toBeInTheDocument()

    topology = 'HIERARCHICAL'
    await queryClient.invalidateQueries({ queryKey: queryKeys.chunks('doc-1') })
    expect(await screen.findByText('parent-1')).toBeInTheDocument()
    expect(screen.queryByText('flat-replaced')).not.toBeInTheDocument()

    topology = 'FLAT'
    await queryClient.invalidateQueries({ queryKey: queryKeys.chunks('doc-1') })
    expect(await screen.findByText('flat-replaced')).toBeInTheDocument()
    expect(screen.queryByText('parent-1')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => /\/documents\/doc-1\/chunks$/.test(String(url)))).toBe(false)
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
