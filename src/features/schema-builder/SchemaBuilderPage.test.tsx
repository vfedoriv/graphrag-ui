import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchemaBuilderPage } from './SchemaBuilderPage'
import { renderWithProviders, jsonResponse, stubFetch } from '../../test/helpers'

const importedSchemaContent = JSON.stringify({
  name: 'legal-contracts',
  version: 1,
  nodes: [
    {
      label: 'Contract',
      key: 'contractId',
      properties: [{ name: 'contractId', type: 'string', required: true }],
    },
    {
      label: 'Party',
      key: 'name',
      properties: [{ name: 'name', type: 'string', required: true }],
    },
  ],
  relationships: [{ type: 'HAS_PARTY', from: 'Contract', to: 'Party' }],
  indexes: [{ label: 'Contract', properties: ['contractId'], unique: true }],
})

function renderBuilder(initialEntry = '/schema-builder', strict = false) {
  const page = (
    <MemoryRouter initialEntries={[initialEntry]}>
      <SchemaBuilderPage />
    </MemoryRouter>
  )

  return renderWithProviders(
    strict ? <StrictMode>{page}</StrictMode> : page,
    { selectedKnowledgeBaseId: 'kb-a' },
  )
}

describe('SchemaBuilderPage', () => {
  beforeEach(() => {
    localStorage.setItem('graphrag.selectedKnowledgeBase', 'kb-a')
    sessionStorage.clear()
    stubFetch(async (url, init) => {
      if (url.endsWith('/knowledge-bases/kb-a/schemas')) {
        return jsonResponse(200, [
          { id: 'schema-1', name: 'Legal', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'ACTIVE', createdAt: '' },
        ])
      }
      if (url.endsWith('/schemas/schema-1') && (!init?.method || init.method === 'GET')) {
        return jsonResponse(200, {
          id: 'schema-1',
          name: 'Legal',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'h',
          status: 'ACTIVE',
          createdAt: '',
          content: importedSchemaContent,
        })
      }
      if (url.endsWith('/schemas/validate')) {
        return jsonResponse(200, { valid: true, errors: [] })
      }
      if (url.endsWith('/schemas/schema-1') && init?.method === 'PUT') {
        return jsonResponse(200, {
          id: 'schema-1',
          name: 'legal-contracts',
          version: 1,
          sourceType: 'PREDEFINED',
          format: 'JSON',
          contentHash: 'updated',
          status: 'INACTIVE',
          createdAt: '',
          content: String(init.body),
        })
      }
      if (url.endsWith('/schemas') && init?.method === 'POST') {
        return jsonResponse(200, { id: 'schema-new', name: 'legal-contracts', version: 1, sourceType: 'PREDEFINED', format: 'JSON', contentHash: 'h', status: 'INACTIVE', createdAt: '' })
      }
      return jsonResponse(200, [])
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('imports an existing schema into visual elements and raw JSON', async () => {
    const user = userEvent.setup()
    renderBuilder('/schema-builder?schemaId=schema-1', true)

    expect(await screen.findByRole('combobox', { name: 'Import existing schema' })).toHaveValue('schema-1')
    expect(await screen.findByRole('button', { name: 'Contract' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'HAS_PARTY' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Raw View' }))
    expect((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value).toContain('"indexes"')
  })

  it('supports blank draft visual edits and raw JSON synchronization', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Add node' }))
    await user.click(screen.getByRole('button', { name: 'Node1' }))
    await user.clear(screen.getByLabelText('Label'))
    await user.type(screen.getByLabelText('Label'), 'Contract')
    await user.click(screen.getByRole('button', { name: 'Raw View' }))

    expect((screen.getByLabelText('Schema builder JSON content') as HTMLTextAreaElement).value).toContain('"Contract"')
  })

  it('preserves invalid raw JSON and blocks submit actions', async () => {
    const user = userEvent.setup()
    renderBuilder()

    await user.click(await screen.findByRole('button', { name: 'Raw View' }))
    const rawEditor = screen.getByLabelText('Schema builder JSON content')
    fireEvent.change(rawEditor, { target: { value: '{{' } })

    expect(await screen.findByText('JSON parse error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create schema' })).toBeDisabled()
    expect(rawEditor).toHaveValue('{{')
  })

  it('validates, updates, and creates through schema APIs', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderBuilder('/schema-builder?schemaId=schema-1')

    await screen.findByRole('button', { name: 'Contract' })
    await user.click(screen.getByRole('button', { name: 'Validate' }))
    expect(await screen.findByText('Schema is valid.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Update source' }))
    expect(await screen.findByText('Schema legal-contracts v1 updated.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create schema' }))
    expect(await screen.findByText('Schema legal-contracts v1 created.')).toBeInTheDocument()

    await waitFor(() => {
      expect(queryClient.getQueryCache().findAll().length).toBeGreaterThan(0)
    })
  })

  it('loads unsaved generated content from session handoff', async () => {
    const generated = JSON.stringify({
      name: 'generated',
      version: 2,
      nodes: [{ label: 'Asset', key: 'assetId', properties: [{ name: 'assetId', type: 'string', required: true }] }],
      relationships: [],
    })
    sessionStorage.setItem('graphrag.schemaBuilderDraft', generated)
    renderBuilder('/schema-builder?draft=session')

    expect(await screen.findByRole('button', { name: 'Asset' })).toBeInTheDocument()
  })
})
