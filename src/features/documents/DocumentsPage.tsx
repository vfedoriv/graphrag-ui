import { useState } from 'react'
import { useDocumentChunksQuery, useDocumentsQuery, useProcessDocumentMutation, useUploadDocumentMutation } from '../../api/documents'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Table } from '../../shared/ui/Table'

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const processMutation = useProcessDocumentMutation()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const chunksQuery = useDocumentChunksQuery(selectedDocumentId)

  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base before uploading documents.' tone='info' />
  }

  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-bold text-slate-900'>Documents</h1>
      <label className='block rounded-md border border-slate-300 bg-white p-4 text-sm text-slate-700'>
        Upload file
        <input
          className='mt-2 block'
          type='file'
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              uploadMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, file })
            }
          }}
        />
      </label>
      {uploadMutation.error && <Alert title='Upload failed' message={(uploadMutation.error as Error).message} />}
      {documents.length === 0 ? (
        <EmptyState title='No Documents' body='Upload a document and process it to inspect chunks.' />
      ) : (
        <Table
          headers={['Filename', 'Status', 'Error', 'Actions']}
          rows={documents.map((doc) => [
            doc.originalFilename,
            doc.status,
            doc.errorMessage ?? '-',
            <div className='flex gap-2'>
              <Button type='button' onClick={() => processMutation.mutate(doc.id)} className='bg-slate-700'>Process</Button>
              <Button type='button' onClick={() => setSelectedDocumentId(doc.id)}>View chunks</Button>
            </div>,
          ])}
        />
      )}
      {selectedDocumentId && (
        <div className='space-y-2 rounded-md border border-slate-300 bg-white p-4'>
          <h2 className='text-base font-semibold text-slate-900'>Chunks for {selectedDocumentId}</h2>
          {chunksQuery.isLoading ? (
            <p className='text-sm text-slate-600'>Loading chunks...</p>
          ) : (
            <pre className='max-h-72 overflow-auto rounded bg-slate-100 p-2 text-xs'>{JSON.stringify(chunksQuery.data, null, 2)}</pre>
          )}
        </div>
      )}
    </section>
  )
}
