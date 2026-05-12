import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemasPage } from './schemas/SchemasPage'
import { KnowledgeBasesPage } from './knowledge-bases/KnowledgeBasesPage'
import { DocumentsPage } from './documents/DocumentsPage'
import { QueriesPage } from './queries/QueriesPage'
import { renderWithProviders } from '../test/helpers'

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
    renderWithProviders(<SchemasPage />)

    expect(await screen.findByRole('button', { name: 'Create schema' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Validate schema YAML' }))

    expect(screen.getByTestId('schemas-endpoint-tabs-panel-validate-schema-yaml')).toBeInTheDocument()
  })

  it('renders knowledge base inline create section without endpoint tabs', async () => {
    renderWithProviders(<KnowledgeBasesPage />)

    expect(await screen.findByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByTestId('knowledge-bases-create-section')).toBeInTheDocument()
    expect(screen.queryByTestId('knowledge-bases-endpoint-tabs')).not.toBeInTheDocument()
  })

  it('renders documents endpoint tabs', async () => {
    renderWithProviders(<DocumentsPage />)

    expect(await screen.findByRole('button', { name: 'Upload document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inspect document chunks' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select file to upload' })).toBeInTheDocument()
  })

  it('renders queries endpoint tabs', async () => {
    renderWithProviders(<QueriesPage />)

    expect(screen.getByRole('button', { name: 'Ask query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Execute Cypher' })).toBeInTheDocument()
  })

  it('renders schema file-select buttons', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />)

    await user.click(await screen.findByRole('button', { name: 'Generate schema example from file' }))
    expect(screen.getByRole('button', { name: 'Select source file' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Generate schema YAML from file' }))
    expect(screen.getByRole('button', { name: 'Select source text file' })).toBeInTheDocument()
  })
})
