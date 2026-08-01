import { Fragment } from 'react'
import type { DocumentChunk } from '../../api/types'
import { OutputPreview } from '../../shared/ui/OutputPreview'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { getPageAwareChunkMetadata, parseChunkMetadata } from './documentChunkMetadata'

export type ChunkViewMode = 'readable' | 'json'

export function DocumentChunksInspector({
  chunks,
  mode,
  onModeChange,
}: {
  chunks: DocumentChunk[]
  mode: ChunkViewMode
  onModeChange: (mode: ChunkViewMode) => void
}) {
  return (
    <div className='stack'>
      <div className='split-stack'>
        <p className='field-label'>Document chunks</p>
        <div className='view-toggle' aria-label='Document chunk view mode'>
          <ChunkModeButton isActive={mode === 'readable'} onClick={() => onModeChange('readable')}>
            Readable view
          </ChunkModeButton>
          <ChunkModeButton isActive={mode === 'json'} onClick={() => onModeChange('json')}>
            Raw JSON
          </ChunkModeButton>
        </div>
      </div>

      {mode === 'json' ? (
        <OutputPreview label='Document chunks JSON' format='json'>{JSON.stringify(chunks, null, 2)}</OutputPreview>
      ) : (
        <div data-testid='document-chunks-readable-view' className='stack'>
          {chunks.length === 0 ? (
            <p>No chunks returned for this document.</p>
          ) : (
            chunks.map((chunk) => <DocumentChunkCard key={chunk.id} chunk={chunk} />)
          )}
        </div>
      )}
    </div>
  )
}

export function ChunkModeButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type='button'
      aria-pressed={isActive}
      onClick={onClick}
      className={`tab ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  )
}

function DocumentChunkCard({ chunk }: { chunk: DocumentChunk }) {
  const metadata = parseChunkMetadata(chunk.metadata ?? '')
  const source = typeof metadata.source === 'string' ? metadata.source : null
  const pageMetadata = getPageAwareChunkMetadata(metadata)

  return (
    <article className='flow-card'>
      <div className='split-stack'>
        <div>
          <h4>Chunk {chunk.chunkIndex}</h4>
          <p className='break-anywhere'>ID: {chunk.id}</p>
        </div>
        <StatusBadge label={`${chunk.tokenEstimate} tokens`} tone='neutral' />
      </div>

      {source ? (
        <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
          <dt className='font-semibold'>Source</dt>
          <dd className='break-anywhere muted'>{source}</dd>
        </dl>
      ) : null}

      {pageMetadata.length > 0 ? (
        <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
          {pageMetadata.map((item) => (
            <Fragment key={item.label}>
              <dt className='font-semibold'>{item.label}</dt>
              <dd className='break-anywhere muted'>{item.value}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}

      <div className='stack'>
        <p className='field-label'>Text</p>
        <div className='output compact'>
          {chunk.text}
        </div>
      </div>
    </article>
  )
}
