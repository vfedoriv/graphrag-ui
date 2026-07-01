import type {
  DocumentProcessingOptionDefinition,
  DocumentProcessingOptionValue,
} from '../../api/types'

export type ProcessingOptionDraftValue = boolean | string
export type ProcessingOptionDraft = Record<string, ProcessingOptionDraftValue>

export function buildProcessingOptionDraft(definitions: DocumentProcessingOptionDefinition[]): ProcessingOptionDraft {
  return definitions.reduce<ProcessingOptionDraft>((draft, option) => {
    draft[option.key] = toDraftValue(option.savedDefaultValue ?? option.defaultValue, option)
    return draft
  }, {})
}

export function serializeMutableProcessingOptions(
  definitions: DocumentProcessingOptionDefinition[],
  draft: ProcessingOptionDraft,
) {
  return definitions.reduce<Record<string, DocumentProcessingOptionValue>>((payload, option) => {
    if (!option.mutable) return payload
    payload[option.key] = serializeProcessingOptionValue(option, draft[option.key])
    return payload
  }, {})
}

export function getAllowedValues(option: DocumentProcessingOptionDefinition) {
  return option.allowedValues ?? option.constraints?.allowedValues ?? []
}

export function getNumericConstraint(option: DocumentProcessingOptionDefinition, key: 'min' | 'max') {
  const value = option.constraints?.[key]
  return typeof value === 'number' ? value : undefined
}

export function formatProcessingOptionValue(value: DocumentProcessingOptionValue | undefined) {
  if (value === undefined || value === null || value === '') return 'None'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function toDraftValue(value: DocumentProcessingOptionValue, option: DocumentProcessingOptionDefinition): ProcessingOptionDraftValue {
  if (option.valueType === 'BOOLEAN') {
    return value === true || value === 'true'
  }
  if (value === undefined || value === null) {
    return ''
  }
  return String(value)
}

function serializeProcessingOptionValue(
  option: DocumentProcessingOptionDefinition,
  value: ProcessingOptionDraftValue | undefined,
): DocumentProcessingOptionValue {
  if (option.valueType === 'BOOLEAN') {
    return value === true || value === 'true'
  }
  if (option.valueType === 'INTEGER') {
    if (typeof value === 'number') return value
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null
  }
  return typeof value === 'string' ? value : ''
}
