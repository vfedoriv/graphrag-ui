import { useState } from 'react'
import {
  useDeleteSchemaMutation,
  useGetSchemaMutation,
  useUpdateSchemaMutation,
} from '../../api/schemas'
import type { Schema, SchemaDetails } from '../../api/types'
import { isSupportedSchemaSourceType } from './schemaUtils'

export function useSchemaRowActions({ selectedKnowledgeBaseId }: { selectedKnowledgeBaseId: string | null }) {
  const [schemaDetailsLabel, setSchemaDetailsLabel] = useState('')
  const [schemaDetailsOutput, setSchemaDetailsOutput] = useState('')
  const [editingSchema, setEditingSchema] = useState<SchemaDetails | null>(null)
  const [updateDraft, setUpdateDraft] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [deleteTargetLabel, setDeleteTargetLabel] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const getSchemaMutation = useGetSchemaMutation()
  const getSchemaForUpdateMutation = useGetSchemaMutation()
  const updateMutation = useUpdateSchemaMutation()
  const deleteMutation = useDeleteSchemaMutation()

  const openUpdateEditor = async (schema: Schema) => {
    setUpdateSuccess('')
    setDeleteSuccess('')
    setDeleteTargetLabel('')
    getSchemaForUpdateMutation.reset()
    updateMutation.reset()
    deleteMutation.reset()
    try {
      const details = await getSchemaForUpdateMutation.mutateAsync(schema.id)
      setEditingSchema(details)
      setUpdateDraft(details.content)
    } catch {
      // surfaced via getSchemaForUpdateMutation.error
    }
  }

  const loadSchemaDetails = async (schema: Schema) => {
    const label = `${schema.name} v${schema.version}`
    setSchemaDetailsLabel(label)
    setSchemaDetailsOutput('')
    getSchemaMutation.reset()
    try {
      const details = await getSchemaMutation.mutateAsync(schema.id)
      setSchemaDetailsOutput(JSON.stringify(details, null, 2))
    } catch {
      // surfaced via getSchemaMutation.error
    }
  }

  const saveUpdate = async () => {
    if (!editingSchema) return

    updateMutation.reset()
    try {
      const updated = await updateMutation.mutateAsync({
        schemaId: editingSchema.id,
        knowledgeBaseId: selectedKnowledgeBaseId,
        payload: {
          content: updateDraft,
          sourceType: isSupportedSchemaSourceType(editingSchema.sourceType) ? editingSchema.sourceType : undefined,
        },
      })
      setEditingSchema(updated)
      setUpdateDraft(updated.content)
      setUpdateSuccess(`Schema ${updated.name} v${updated.version} updated.`)
    } catch {
      // surfaced via updateMutation.error
    }
  }

  const cancelUpdate = () => {
    setEditingSchema(null)
    setUpdateDraft('')
    setUpdateSuccess('')
  }

  const deleteSchema = async (schema: Schema) => {
    const label = `${schema.name} v${schema.version} (${schema.id})`
    const confirmed = window.confirm(`Delete schema ${label}?`)
    if (!confirmed) return

    deleteMutation.reset()
    setDeleteTargetLabel(label)
    setDeleteSuccess('')
    try {
      await deleteMutation.mutateAsync({ schemaId: schema.id, knowledgeBaseId: selectedKnowledgeBaseId })
      if (editingSchema?.id === schema.id) {
        cancelUpdate()
      }
      setDeleteSuccess(`Schema ${label} deleted.`)
      setDeleteTargetLabel('')
    } catch {
      // surfaced via deleteMutation.error
    }
  }

  return {
    state: {
      schemaDetailsLabel,
      schemaDetailsOutput,
      editingSchema,
      updateDraft,
      updateSuccess,
      deleteTargetLabel,
      deleteSuccess,
    },
    mutations: {
      getSchemaMutation,
      getSchemaForUpdateMutation,
      updateMutation,
      deleteMutation,
    },
    setSchemaDetailsOutput,
    setUpdateDraft,
    openUpdateEditor,
    loadSchemaDetails,
    saveUpdate,
    cancelUpdate,
    deleteSchema,
  }
}
