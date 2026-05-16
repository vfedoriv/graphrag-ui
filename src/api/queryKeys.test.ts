import { queryKeys } from './queryKeys'

describe('query keys', () => {
  it('produces stable keys', () => {
    expect(queryKeys.knowledgeBases()).toEqual(['knowledge-bases'])
    expect(queryKeys.knowledgeBase('kb')).toEqual(['knowledge-bases', 'kb'])
    expect(queryKeys.schemaLookup('schema-1')).toEqual(['schemas', 'lookup', 'schema-1'])
    expect(queryKeys.documents('kb-1')).toEqual(['documents', 'knowledge-base', 'kb-1'])
    expect(queryKeys.documentsMaybe('kb-1')).toEqual(['documents', 'knowledge-base', 'kb-1'])
    expect(queryKeys.documentsMaybe(null)).toEqual(['documents', 'knowledge-base', 'none'])
    expect(queryKeys.chunks('doc-1')).toEqual(['documents', 'chunks', 'doc-1'])
    expect(queryKeys.chunksMaybe('doc-1')).toEqual(['documents', 'chunks', 'doc-1'])
    expect(queryKeys.chunksMaybe(null)).toEqual(['documents', 'chunks', 'none'])
  })
})
