import { screen } from '@testing-library/react'
import { RuntimeContextSummary } from './RuntimeContextSummary'
import { jsonResponse, renderWithProviders, stubFetch } from '../../test/helpers'

describe('RuntimeContextSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('routes provider edits separately from other runtime property edits', async () => {
    stubFetch((url) => {
      if (url.endsWith('/knowledge-bases') || url.endsWith('/ai-profiles') || url.endsWith('/runtime-settings')) {
        return jsonResponse(200, [])
      }
      return jsonResponse(404, {})
    })

    renderWithProviders(
      <RuntimeContextSummary knowledgeBaseId={null} settingHints={['query']} title='Workflow runtime context' />,
    )

    expect(await screen.findByRole('link', { name: 'Manage AI providers' })).toHaveAttribute('href', '/ai-providers')
    expect(screen.getByRole('link', { name: 'Manage runtime properties' })).toHaveAttribute('href', '/settings')
  })
})
