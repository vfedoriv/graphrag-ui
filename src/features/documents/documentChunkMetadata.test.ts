import { getPageAwareChunkMetadata, parseChunkMetadata } from './documentChunkMetadata'

describe('document chunk metadata helpers', () => {
  it('parses object metadata and derives page-aware labels', () => {
    const metadata = parseChunkMetadata(
      JSON.stringify({
        source: 'manual.pdf',
        page_number: 3,
        totalPages: 10,
        parser_id: 'tika-pdf',
        format: 'PDF',
        section: false,
        run_id: 'run-7',
      }),
    )

    expect(metadata.source).toBe('manual.pdf')
    expect(getPageAwareChunkMetadata(metadata)).toEqual([
      { label: 'Page', value: '3' },
      { label: 'Page count', value: '10' },
      { label: 'Parser', value: 'tika-pdf' },
      { label: 'File format', value: 'PDF' },
      { label: 'Section', value: 'false' },
      { label: 'Processing run', value: 'run-7' },
    ])
  })

  it('falls back to empty metadata for invalid or non-object values', () => {
    expect(parseChunkMetadata('{')).toEqual({})
    expect(parseChunkMetadata('[]')).toEqual({})
    expect(parseChunkMetadata('"text"')).toEqual({})
    expect(getPageAwareChunkMetadata({ sourcePage: '   ', parserId: null })).toEqual([])
  })
})
