import { screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('dashboard page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('shows active schema name instead of schema id', async () => {
    stubFetch((url, init) => {
      if (url === '/api/v1/knowledge-bases' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'kb-a',
            name: 'KB A',
            activeSchemaId: 'schema-a',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url === '/api/v1/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Claim event',
            version: 3,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url === '/api/v1/knowledge-bases/kb-a/schemas' && !init?.method) {
        return jsonResponse(200, [
          {
            id: 'schema-a',
            name: 'Claim event',
            version: 3,
            sourceType: 'PREDEFINED',
            format: 'JSON',
            contentHash: 'hash',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }
      if (url === '/api/v1/knowledge-bases/kb-a/documents' && !init?.method) {
        return jsonResponse(200, [])
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
      { selectedKnowledgeBaseId: 'kb-a' },
    )

    expect(await screen.findByText('Active schema: Claim event')).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Knowledge base list' })
    expect(within(table).getByText('Claim event')).toBeInTheDocument()
    expect(within(table).queryByText('schema-a')).not.toBeInTheDocument()
  })
})
