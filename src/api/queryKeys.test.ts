import { queryKeys } from './queryKeys'

describe('query keys', () => {
  it('produces stable keys', () => {
    expect(queryKeys.knowledgeBases()).toEqual(['knowledge-bases'])
    expect(queryKeys.knowledgeBase('kb')).toEqual(['knowledge-bases', 'kb'])
    expect(queryKeys.documents('kb-1')).toEqual(['documents', 'kb-1'])
  })
})
