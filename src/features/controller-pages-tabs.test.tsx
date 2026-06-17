import { screen, within } from '@testing-library/react'
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

  it('renders schemas purpose tabs', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />)

    const tabs = await screen.findByTestId('schemas-purpose-tabs')
    expect(within(tabs).getByRole('button', { name: 'Schema example generation' })).toBeInTheDocument()
    expect(within(tabs).getByRole('button', { name: 'Schema JSON generation' })).toBeInTheDocument()
    expect(within(tabs).getByRole('button', { name: 'Schema validation' })).toBeInTheDocument()
    expect(within(tabs).getByRole('button', { name: 'Schema creation' })).toBeInTheDocument()

    await user.click(within(tabs).getByRole('button', { name: 'Schema validation' }))
    const validateSection = within(tabs).getByTestId('schema-validation-section')
    expect(within(validateSection).getByLabelText('Schema JSON content')).toBeInTheDocument()
  })

  it('renders knowledge base inline create section without endpoint tabs', async () => {
    renderWithProviders(<KnowledgeBasesPage />)

    expect(await screen.findByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByTestId('knowledge-bases-create-section')).toBeInTheDocument()
    expect(screen.getByLabelText('Knowledge base ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Knowledge base name')).toBeInTheDocument()
    expect(screen.queryByTestId('knowledge-bases-endpoint-tabs')).not.toBeInTheDocument()
  })

  it('renders documents endpoint tabs', async () => {
    renderWithProviders(<DocumentsPage />)

    expect(await screen.findByText('Upload document')).toBeInTheDocument()
    expect(screen.getByText('Inspect document chunks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select file to upload' })).toBeInTheDocument()
  })

  it('renders queries endpoint tabs', async () => {
    renderWithProviders(<QueriesPage />)

    expect(screen.getByRole('button', { name: 'Ask query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Execute Cypher' })).toBeInTheDocument()
    expect(screen.getByLabelText('Question prompt', { selector: '#ask-query-prompt' })).toBeInTheDocument()
  })

  it('renders schema file-select buttons', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchemasPage />)

    const tabs = await screen.findByTestId('schemas-purpose-tabs')
    const exampleSection = within(tabs).getByTestId('schema-example-generation-section')
    await user.click(within(exampleSection).getByLabelText('From file', { selector: 'input' }))
    expect(screen.getByRole('button', { name: 'Select source file' })).toBeInTheDocument()

    await user.click(within(tabs).getByRole('button', { name: 'Schema JSON generation' }))
    const jsonSection = within(tabs).getByTestId('schema-json-generation-section')
    await user.click(within(jsonSection).getByLabelText('From file', { selector: 'input' }))
    expect(screen.getByRole('button', { name: 'Select source text file' })).toBeInTheDocument()
  })
})
