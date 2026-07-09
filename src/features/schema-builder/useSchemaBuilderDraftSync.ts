import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { SchemaDetails } from '../../api/types'
import {
  createBlankSchemaDraft,
  parseSchemaContentToDraft,
  serializeSchemaDraft,
  validateSchemaBuilderDraft,
} from './schemaBuilderMapping'
import type { RelationshipRouteOverride, SchemaFlowNode, SelectedElement } from './schemaBuilderFlow'
import type { SchemaBuilderDraft } from './schemaBuilderTypes'
import { SCHEMA_BUILDER_DRAFT_STORAGE_KEY } from './schemaBuilderStorage'

export type DragPreviewNodeData = Pick<SchemaFlowNode, 'id' | 'position' | 'data'> | null

export function useSchemaBuilderDraftSync({
  searchParams,
  getSchemaMutation,
}: {
  searchParams: URLSearchParams
  getSchemaMutation: UseMutationResult<SchemaDetails, Error, string>
}) {
  const [draft, setDraft] = useState<SchemaBuilderDraft>(() => createBlankSchemaDraft())
  const [rawJson, setRawJson] = useState(() => serializeSchemaDraft(createBlankSchemaDraft()))
  const [rawParseError, setRawParseError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null)
  const [relationshipRouteOverrides, setRelationshipRouteOverrides] = useState<Record<string, RelationshipRouteOverride>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [schemaSelectValue, setSchemaSelectValue] = useState('')
  const [dragPreviewNode, setDragPreviewNode] = useState<DragPreviewNodeData>(null)
  const initialLoadKeyRef = useRef('')

  const localIssues = useMemo(() => validateSchemaBuilderDraft(draft, rawParseError), [draft, rawParseError])

  const replaceDraft = useCallback((nextDraft: SchemaBuilderDraft) => {
    setDraft(nextDraft)
    setRawJson(serializeSchemaDraft(nextDraft))
    setRawParseError(null)
    setSelectedElement(null)
    setRelationshipRouteOverrides({})
    setDragPreviewNode(null)
    setSuccessMessage('')
  }, [])

  const importSchemaDetails = useCallback((details: SchemaDetails) => {
    const result = parseSchemaContentToDraft(details.content, { schemaId: details.id, sourceType: details.sourceType })
    if (result.ok) {
      replaceDraft(result.draft)
      setSchemaSelectValue(details.id)
    } else {
      setRawJson(details.content)
      setRawParseError(result.error)
    }
  }, [replaceDraft])

  const importRawContent = useCallback((content: string) => {
    const result = parseSchemaContentToDraft(content)
    if (result.ok) {
      replaceDraft(result.draft)
    } else {
      setRawJson(content)
      setRawParseError(result.error)
      setSuccessMessage('')
    }
  }, [replaceDraft])

  const loadSchemaById = useCallback(async (schemaId: string) => {
    setSuccessMessage('')
    getSchemaMutation.reset()
    try {
      const details = await getSchemaMutation.mutateAsync(schemaId)
      importSchemaDetails(details)
    } catch {
      // surfaced by mutation error
    }
  }, [getSchemaMutation, importSchemaDetails])

  useEffect(() => {
    const schemaId = searchParams.get('schemaId')
    const draftSource = searchParams.get('draft')
    const key = `${schemaId ?? ''}:${draftSource ?? ''}`
    if (key === initialLoadKeyRef.current) return

    if (schemaId) {
      const timeout = window.setTimeout(() => {
        initialLoadKeyRef.current = key
        void loadSchemaById(schemaId)
      }, 0)
      return () => window.clearTimeout(timeout)
    }

    if (draftSource === 'session') {
      const timeout = window.setTimeout(() => {
        initialLoadKeyRef.current = key
        const storedDraft = sessionStorage.getItem(SCHEMA_BUILDER_DRAFT_STORAGE_KEY)
        if (storedDraft) {
          importRawContent(storedDraft)
        }
      }, 0)
      return () => window.clearTimeout(timeout)
    }

    return undefined
  }, [importRawContent, loadSchemaById, searchParams])

  const updateDraft = useCallback((updater: (current: SchemaBuilderDraft) => SchemaBuilderDraft) => {
    setDraft((current) => {
      const nextDraft = updater(current)
      setRawJson(serializeSchemaDraft(nextDraft))
      setRawParseError(null)
      setSuccessMessage('')
      return nextDraft
    })
  }, [])

  const updateRawJson = useCallback((nextValue: string) => {
    setRawJson(nextValue)
    setSuccessMessage('')
    setDraft((currentDraft) => {
      const result = parseSchemaContentToDraft(nextValue, { schemaId: currentDraft.sourceSchemaId, sourceType: currentDraft.sourceType })
      if (result.ok) {
        setRawParseError(null)
        setRelationshipRouteOverrides({})
        setDragPreviewNode(null)
        return result.draft
      }
      setRawParseError(result.error)
      return currentDraft
    })
  }, [])

  return {
    draft,
    rawJson,
    rawParseError,
    selectedElement,
    relationshipRouteOverrides,
    successMessage,
    schemaSelectValue,
    dragPreviewNode,
    localIssues,
    setDraft,
    setRawJson,
    setRawParseError,
    setSelectedElement,
    setRelationshipRouteOverrides,
    setSuccessMessage,
    setSchemaSelectValue,
    setDragPreviewNode,
    replaceDraft,
    importSchemaDetails,
    loadSchemaById,
    updateDraft,
    updateRawJson,
  }
}
