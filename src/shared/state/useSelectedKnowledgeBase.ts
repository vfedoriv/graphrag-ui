import { useContext } from 'react'
import { SelectedKnowledgeBaseContext } from './selectedKnowledgeBaseContext'

export function useSelectedKnowledgeBase() {
  const ctx = useContext(SelectedKnowledgeBaseContext)
  if (!ctx) {
    throw new Error('useSelectedKnowledgeBase must be used within SelectedKnowledgeBaseProvider')
  }
  return ctx
}
