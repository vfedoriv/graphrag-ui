import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { SelectedKnowledgeBaseProvider } from '../shared/state/selectedKnowledgeBase'
import { SchemasPage } from './schemas/SchemasPage'
import { KnowledgeBasesPage } from './knowledge-bases/KnowledgeBasesPage'
import { DocumentsPage } from './documents/DocumentsPage'
import { QueriesPage } from './queries/QueriesPage'

function wrapper(children: ReactNode) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <SelectedKnowledgeBaseProvider>{children}</SelectedKnowledgeBaseProvider>
    </QueryClientProvider>
  )
}

describe('controller pages tabs', () => {
  beforeEach(() => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'kb-a')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/knowledge-bases/kb-a/documents')) {
          return { ok: true, status: 200, text: async () => '[]' }
        }
        if (url.includes('/schemas')) {
          return { ok: true, status: 200, text: async () => '[]' }
        }
        if (url.includes('/knowledge-bases')) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify([{ id: 'kb-a', name: 'KB A', activeSchemaId: null, createdAt: '2026-01-01T00:00:00Z' }]),
          }
        }
        return { ok: true, status: 200, text: async () => '[]' }
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('renders schemas endpoint tabs and switches active tab', async () => {
    const user = userEvent.setup()
    render(wrapper(<SchemasPage />))

    expect(await screen.findByRole('button', { name: 'Create schema' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Validate schema YAML' }))

    expect(screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-yaml')).toBeInTheDocument()
  })

  it('renders knowledge base endpoint tabs', async () => {
    render(wrapper(<KnowledgeBasesPage />))

    expect(await screen.findByRole('button', { name: 'Create knowledge base' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update knowledge base' })).toBeInTheDocument()
  })

  it('renders documents endpoint tabs', async () => {
    render(wrapper(<DocumentsPage />))

    expect(await screen.findByRole('button', { name: 'Upload document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inspect document chunks' })).toBeInTheDocument()
  })

  it('renders queries endpoint tabs', async () => {
    render(wrapper(<QueriesPage />))

    expect(screen.getByRole('button', { name: 'Ask query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Execute Cypher' })).toBeInTheDocument()
  })
})
