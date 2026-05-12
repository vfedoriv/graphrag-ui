import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { SelectedKnowledgeBaseProvider } from '../shared/state/selectedKnowledgeBase'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: { selectedKnowledgeBaseId?: string | null; queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient()
  if (options?.selectedKnowledgeBaseId) {
    localStorage.setItem('graphrag.selectedKnowledgeBase', options.selectedKnowledgeBaseId)
  } else if (options?.selectedKnowledgeBaseId === null) {
    localStorage.removeItem('graphrag.selectedKnowledgeBase')
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SelectedKnowledgeBaseProvider>{children}</SelectedKnowledgeBaseProvider>
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient,
  }
}

type MockResponse = {
  ok: boolean
  status: number
  text: () => Promise<string>
  json: () => Promise<unknown>
}

export function jsonResponse(status: number, payload: unknown): MockResponse {
  const body = JSON.stringify(payload)
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => payload,
  }
}

export function textResponse(status: number, body: string): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  }
}

export function stubFetch(
  responder: (url: string, init?: RequestInit) => MockResponse | Promise<MockResponse>,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => responder(String(input), init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
