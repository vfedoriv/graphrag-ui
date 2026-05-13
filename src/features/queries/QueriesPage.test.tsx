import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueriesPage } from './QueriesPage'
import { jsonResponse } from '../../test/helpers'
import { renderWithProviders, stubFetch } from '../../test/helpers'

describe('queries page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows ask error alert when ask mutation fails', async () => {
    const user = userEvent.setup()
    stubFetch((url) => {
      if (url.endsWith('/queries/ask')) {
        return jsonResponse(400, { detail: 'Ask failed from server' })
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderWithProviders(<QueriesPage />, { selectedKnowledgeBaseId: 'kb-a' })

    await user.click(screen.getByRole('button', { name: 'Ask' }))

    await waitFor(() => {
      expect(screen.getByText('Ask failed')).toBeInTheDocument()
      expect(screen.getByText('Ask failed from server')).toBeInTheDocument()
    })
  })
})
