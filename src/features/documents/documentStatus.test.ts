import { isCompletedOrSuccessfullyProcessed, isDocumentProcessingStatus } from './documentStatus'

describe('document status helpers', () => {
  it.each(['EXTRACTING_GRAPH', 'PROCESSING', 'IN_PROGRESS', 'PENDING', 'RUNNING', 'QUEUED', 'EMBEDDING_TEXT'])(
    'classifies %s as actively processing',
    (status) => {
      expect(isDocumentProcessingStatus(status)).toBe(true)
    },
  )

  it.each(['COMPLETED', 'PROCESSED', 'SUCCESSFULLY_PROCESSED'])(
    'classifies %s as completed or successfully processed',
    (status) => {
      expect(isCompletedOrSuccessfullyProcessed(status)).toBe(true)
      expect(isDocumentProcessingStatus(status)).toBe(false)
    },
  )

  it.each(['UPLOADED', 'FAILED', 'ERROR', 'UNKNOWN', ''])('does not classify %s as actively processing', (status) => {
    expect(isDocumentProcessingStatus(status)).toBe(false)
  })
})
