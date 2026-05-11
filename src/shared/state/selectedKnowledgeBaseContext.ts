import { createContext } from 'react'

export type SelectedKnowledgeBaseContextValue = {
  selectedKnowledgeBaseId: string | null
  setSelectedKnowledgeBaseId: (id: string | null) => void
}

export const SelectedKnowledgeBaseContext =
  createContext<SelectedKnowledgeBaseContextValue | null>(null)
