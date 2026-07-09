import type { DocumentUpload } from '../../api/types'
import { Button } from '../../shared/ui/Button'
import { getDocumentOpenTarget } from './documentSource'

export function DocumentSourceContext({
  doc,
  wasCopied,
  isOpening,
  onOpen,
  onCopy,
}: {
  doc: DocumentUpload
  wasCopied: boolean
  isOpening: boolean
  onOpen: () => void
  onCopy: () => void
}) {
  const openTarget = getDocumentOpenTarget(doc)
  const hasActions = Boolean(openTarget || doc.localPath)

  return (
    <div className='stack'>
      {hasActions ? (
        <div className='toolbar'>
          <Button
            type='button'
            variant='ghost'
            isPending={isOpening}
            pendingText='Opening...'
            disabled={!openTarget}
            onClick={() => {
              void onOpen()
            }}
          >
            Open
          </Button>
          <Button
            type='button'
            variant='ghost'
            disabled={!doc.localPath}
            onClick={onCopy}
          >
            {wasCopied ? 'Copied' : 'Copy path'}
          </Button>
        </div>
      ) : (
        <span className='muted'>-</span>
      )}
    </div>
  )
}
