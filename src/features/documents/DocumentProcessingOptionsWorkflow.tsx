import type { DocumentProcessingOptionDefinition, DocumentProcessingOptionsResponse } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { formatDocumentErrorMessage } from './documentErrors'
import {
  formatProcessingOptionValue,
  getAllowedValues,
  getNumericConstraint,
  type ProcessingOptionDraft,
  type ProcessingOptionDraftValue,
} from './processingOptions'

export function DocumentProcessingOptionsWorkflow({
  data,
  draft,
  error,
  isLoading,
  isSaving,
  isClearing,
  isProcessing,
  saveError,
  clearError,
  processError,
  onDraftChange,
  onSave,
  onClear,
  onProcess,
}: {
  data?: DocumentProcessingOptionsResponse
  draft: ProcessingOptionDraft
  error: unknown
  isLoading: boolean
  isSaving: boolean
  isClearing: boolean
  isProcessing: boolean
  saveError: unknown
  clearError: unknown
  processError: unknown
  onDraftChange: (key: string, value: ProcessingOptionDraftValue) => void
  onSave: () => void
  onClear: () => void
  onProcess: () => void
}) {
  if (isLoading) {
    return <p>Loading processing options...</p>
  }

  if (error) {
    return <Alert title='Load processing options failed' message={formatDocumentErrorMessage(error)} />
  }

  if (!data) {
    return <p>Select a document from the table to load processing options.</p>
  }

  return (
    <div className='stack' data-testid='document-processing-options-workflow'>
      <div className='badge-row'>
        <StatusBadge label={`Parser: ${data.parserId}`} tone='neutral' />
        <StatusBadge label={`Format: ${data.fileFormat}`} tone='neutral' />
        {data.savedDefaultsUpdatedAt ? <StatusBadge label={`Saved: ${data.savedDefaultsUpdatedAt}`} tone='success' /> : null}
      </div>

      {saveError ? <Alert title='Save defaults failed' message={formatDocumentErrorMessage(saveError)} /> : null}
      {clearError ? <Alert title='Clear defaults failed' message={formatDocumentErrorMessage(clearError)} /> : null}
      {processError ? <Alert title='Process with options failed' message={formatDocumentErrorMessage(processError)} /> : null}

      <ProcessingOptionsEditor data={data} draft={draft} onDraftChange={onDraftChange} />

      <div className='toolbar'>
        <Button type='button' variant='primary' isPending={isSaving} pendingText='Saving...' onClick={onSave}>
          Save defaults
        </Button>
        <Button type='button' variant='ghost' isPending={isClearing} pendingText='Clearing...' onClick={onClear}>
          Clear defaults
        </Button>
        <Button type='button' variant='ghost' isPending={isProcessing} pendingText='Processing...' onClick={onProcess}>
          Process with options
        </Button>
      </div>
    </div>
  )
}

export function ProcessingOptionsEditor({ data, draft, onDraftChange }: {
  data: DocumentProcessingOptionsResponse
  draft: ProcessingOptionDraft
  onDraftChange: (key: string, value: ProcessingOptionDraftValue) => void
}) {
  return <div className='stack'>
    {data.options.length === 0 ? <p>No processing options are available for this document.</p> : data.options.map((option) => <ProcessingOptionControl key={option.key} option={option} value={draft[option.key]} onChange={(value) => onDraftChange(option.key, value)} />)}
  </div>
}

export function ProcessingOptionControl({
  option,
  value,
  onChange,
}: {
  option: DocumentProcessingOptionDefinition
  value: ProcessingOptionDraftValue | undefined
  onChange: (value: ProcessingOptionDraftValue) => void
}) {
  const controlId = `processing-option-${option.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const label = option.label ?? option.key
  const allowedValues = getAllowedValues(option)
  const effectiveValue = value ?? ''

  return (
    <section className='flow-card'>
      <div className='split-stack'>
        <div>
          <h4>{label}</h4>
          <p className='break-anywhere'>{option.key}</p>
        </div>
        <StatusBadge label={option.mutable ? option.valueType : 'Read-only'} tone={option.mutable ? 'neutral' : 'warning'} />
      </div>
      {option.description ? <p>{option.description}</p> : null}

      {option.mutable ? (
        <div>
          {option.valueType === 'BOOLEAN' ? (
            <label className='check-row'>
              <input
                id={controlId}
                type='checkbox'
                checked={effectiveValue === true}
                onChange={(event) => onChange(event.target.checked)}
              />
              <span>Value for {label}</span>
            </label>
          ) : option.valueType === 'INTEGER' ? (
            <>
              <label htmlFor={controlId} className='field-label'>
                Value for {label}
              </label>
              <input
                id={controlId}
                type='number'
                min={getNumericConstraint(option, 'min')}
                max={getNumericConstraint(option, 'max')}
                value={String(effectiveValue)}
                onChange={(event) => onChange(event.target.value)}
              />
            </>
          ) : allowedValues.length > 0 ? (
            <>
              <label htmlFor={controlId} className='field-label'>
                Value for {label}
              </label>
              <select id={controlId} value={String(effectiveValue)} onChange={(event) => onChange(event.target.value)}>
                {!allowedValues.includes(String(effectiveValue)) ? <option value={String(effectiveValue)}>{String(effectiveValue)}</option> : null}
                {allowedValues.map((allowedValue) => (
                  <option key={allowedValue} value={allowedValue}>
                    {allowedValue}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label htmlFor={controlId} className='field-label'>
                Value for {label}
              </label>
              <input
                id={controlId}
                type='text'
                value={String(effectiveValue)}
                onChange={(event) => onChange(event.target.value)}
              />
            </>
          )}
        </div>
      ) : (
        <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
          <dt className='font-semibold'>Value</dt>
          <dd className='break-anywhere muted'>{formatProcessingOptionValue(option.savedDefaultValue ?? option.defaultValue)}</dd>
        </dl>
      )}

      <dl className='grid gap-1 sm:grid-cols-[auto_1fr]'>
        <dt className='font-semibold'>Built-in default</dt>
        <dd className='break-anywhere muted'>{formatProcessingOptionValue(option.defaultValue)}</dd>
        <dt className='font-semibold'>Saved default</dt>
        <dd className='break-anywhere muted'>{formatProcessingOptionValue(option.savedDefaultValue)}</dd>
        {option.mutable ? (
          <>
            <dt className='font-semibold'>Current draft</dt>
            <dd className='break-anywhere muted'>{formatProcessingOptionValue(typeof effectiveValue === 'boolean' ? effectiveValue : String(effectiveValue))}</dd>
          </>
        ) : null}
      </dl>
    </section>
  )
}
