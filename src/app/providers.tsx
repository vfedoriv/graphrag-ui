import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SelectedKnowledgeBaseProvider } from '../shared/state/selectedKnowledgeBase'
import { ThemeProvider } from '../shared/state/ThemeProvider'

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SelectedKnowledgeBaseProvider>{children}</SelectedKnowledgeBaseProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
