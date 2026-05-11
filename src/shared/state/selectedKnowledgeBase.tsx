import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { SelectedKnowledgeBaseContext } from './selectedKnowledgeBaseContext'

const STORAGE_KEY = 'graphrag.selectedKnowledgeBase'

function initialSelectedKnowledgeBaseId() {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(STORAGE_KEY)
}

export function SelectedKnowledgeBaseProvider({ children }: { children: ReactNode }) {
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(
    initialSelectedKnowledgeBaseId,
  )

  useEffect(() => {
    if (selectedKnowledgeBaseId) {
      localStorage.setItem(STORAGE_KEY, selectedKnowledgeBaseId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [selectedKnowledgeBaseId])

  const value = useMemo(
    () => ({ selectedKnowledgeBaseId, setSelectedKnowledgeBaseId }),
    [selectedKnowledgeBaseId],
  )

  return (
    <SelectedKnowledgeBaseContext.Provider value={value}>
      {children}
    </SelectedKnowledgeBaseContext.Provider>
  )
}
