import { useState } from 'react'
import { useDocumentChunksQuery, useDocumentsQuery, useProcessDocumentMutation, useUploadDocumentMutation } from '../../api/documents'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { type EndpointTab, EndpointTabs } from '../../shared/ui/EndpointTabs'
import { FileSelectButton } from '../../shared/ui/FileSelectButton'
import { Table } from '../../shared/ui/Table'

export function DocumentsPage() {
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: documents = [] } = useDocumentsQuery(selectedKnowledgeBaseId)
  const uploadMutation = useUploadDocumentMutation()
  const processMutation = useProcessDocumentMutation()
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedUploadFilename, setSelectedUploadFilename] = useState<string>('')
  const chunksQuery = useDocumentChunksQuery(selectedDocumentId)

  if (!selectedKnowledgeBaseId) {
    return <Alert title='No knowledge base selected' message='Select a knowledge base before uploading documents.' tone='info' />
  }

  const topSection = documents.length === 0 ? (
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
  )

  const tabs: EndpointTab[] = [
    {
      id: 'upload-document',
      label: 'Upload document',
      content: (
        <>
          <FileSelectButton
            buttonLabel='Select file to upload'
            testId='documents-upload-select-file'
            onFileSelected={(file) => {
              setSelectedUploadFilename(file.name)
              uploadMutation.mutate({ knowledgeBaseId: selectedKnowledgeBaseId, file })
            }}
          />
          {selectedUploadFilename && <p className='text-sm text-slate-600'>Selected file: {selectedUploadFilename}</p>}
          {uploadMutation.error && <Alert title='Upload failed' message={(uploadMutation.error as Error).message} />}
        </>
      ),
    },
    {
      id: 'process-document',
      label: 'Process document',
      content: <p className='text-sm text-slate-700'>Use the Process action in the documents table above to invoke document processing for a specific upload.</p>,
    },
    {
      id: 'inspect-chunks',
      label: 'Inspect document chunks',
      content: selectedDocumentId ? (
        <div className='space-y-2'>
          <h2 className='text-base font-semibold text-slate-900'>Chunks for {selectedDocumentId}</h2>
          {chunksQuery.isLoading ? (
            <p className='text-sm text-slate-600'>Loading chunks...</p>
          ) : (
            <pre className='max-h-72 overflow-auto rounded bg-slate-100 p-2 text-xs'>{JSON.stringify(chunksQuery.data, null, 2)}</pre>
          )}
        </div>
      ) : (
        <p className='text-sm text-slate-700'>Choose a document in the table above and click View chunks.</p>
      ),
    },
  ]

  return (
    <ControllerPage
      title='Documents'
      topSectionTitle='Documents list'
      topSection={topSection}
      tabs={<EndpointTabs tabs={tabs} testId='documents-endpoint-tabs' />}
      testId='documents-controller-page'
    />
  )
}
