import { useId, useRef, type ChangeEvent } from 'react'
import { Button } from './Button'

type FileSelectButtonProps = {
  buttonLabel: string
  onFileSelected: (file: File) => void | Promise<void>
  accept?: string
  testId?: string
}

export function FileSelectButton({ buttonLabel, onFileSelected, accept, testId }: FileSelectButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onFileSelected(file)
    event.target.value = ''
  }

  return (
    <div className='space-y-2'>
      <input
        id={inputId}
        ref={inputRef}
        type='file'
        accept={accept}
        onChange={handleChange}
        className='sr-only'
        data-testid={testId ? `${testId}-input` : undefined}
      />
      <Button
        type='button'
        onClick={() => inputRef.current?.click()}
        data-testid={testId}
      >
        {buttonLabel}
      </Button>
    </div>
  )
}
