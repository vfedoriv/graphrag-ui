import type { DocumentUpload } from '../../api/types'
import { getDocumentOpenTarget } from './documentSource'

const documentFixture: DocumentUpload = {
  id: 'doc-1',
  knowledgeBaseId: 'kb-1',
  originalFilename: 'report.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1,
  sha256: 'hash',
  contentUri: 'https://example.test/report.pdf',
  localPath: null,
  status: 'UPLOADED',
  uploadedAt: '',
  processedAt: null,
  errorMessage: null,
}

function makeDocument(overrides: Partial<DocumentUpload> = {}): DocumentUpload {
  return { ...documentFixture, ...overrides }
}

describe('getDocumentOpenTarget', () => {
  it.each(['/tmp/report.pdf', 'C:\\Documents\\report.pdf'])('prefers the local path %s over a URI', (localPath) => {
    expect(getDocumentOpenTarget(makeDocument({ localPath }))).toBe(localPath)
  })

  it.each(['file:///tmp/report.pdf', 'http://example.test/report.pdf', 'https://example.test/report.pdf'])(
    'returns supported URI %s when no local path is available',
    (contentUri) => {
      expect(getDocumentOpenTarget(makeDocument({ contentUri }))).toBe(contentUri)
    },
  )

  it.each([
    ['an empty URI', ''],
    ['an omitted URI', undefined],
    ['a null URI', null],
  ])('returns null for %s when document source metadata is missing', (_description, contentUri) => {
    expect(getDocumentOpenTarget(makeDocument({ contentUri: contentUri as string }))).toBeNull()
  })

  it.each(['not a URI', 'https://', '://malformed'])('returns null for malformed URI %s', (contentUri) => {
    expect(getDocumentOpenTarget(makeDocument({ contentUri }))).toBeNull()
  })

  it.each(['ftp://example.test/report.pdf', 'mailto:owner@example.test', 'data:text/plain,report'])(
    'returns null for unsupported protocol %s',
    (contentUri) => {
      expect(getDocumentOpenTarget(makeDocument({ contentUri }))).toBeNull()
    },
  )
})
