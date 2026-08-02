import type { ChunkingState, RuntimeSetting } from '../../api/types'
import {
  formatEditableRuntimeValue,
  isNumericSetting,
  parseRuntimeValue,
} from '../settings/runtimeSettingsHelpers'

export type ChunkingView = 'strategy' | 'chunks' | 'explorer' | 'reprocessing'

export function normalizeChunkingView(value: string | null): ChunkingView {
  return value === 'chunks' || value === 'explorer' || value === 'reprocessing' ? value : 'strategy'
}

export const CANONICAL_CHUNKING_CONTROLS = [
  { key: 'app.chunking.strategy', stateKey: 'strategy', label: 'Strategy' },
  { key: 'app.chunking.target-tokens', stateKey: 'targetTokens', label: 'Target tokens' },
  { key: 'app.chunking.overlap-tokens', stateKey: 'overlapTokens', label: 'Overlap tokens' },
  { key: 'app.chunking.hard-character-limit', stateKey: 'hardCharacterLimit', label: 'Hard character limit' },
  { key: 'app.chunking.parent-target-tokens', stateKey: 'parentTargetTokens', label: 'Parent target tokens' },
  { key: 'app.chunking.parent-hard-character-limit', stateKey: 'parentHardCharacterLimit', label: 'Parent hard character limit' },
  { key: 'app.chunking.parent-max-pages', stateKey: 'parentMaxPages', label: 'Parent maximum pages' },
  { key: 'app.chunking.context-header-max-tokens', stateKey: 'contextHeaderMaxTokens', label: 'Contextual-header maximum tokens' },
  { key: 'app.chunking.context-header-max-characters', stateKey: 'contextHeaderMaxCharacters', label: 'Contextual-header maximum characters' },
] as const

export type CanonicalChunkingControl = (typeof CANONICAL_CHUNKING_CONTROLS)[number]

export function effectiveValueForControl(state: ChunkingState | undefined, control: CanonicalChunkingControl) {
  return state?.[control.stateKey]
}

export function formatChunkingValue(value: unknown) {
  return formatEditableRuntimeValue(value)
}

export function enumValues(setting: RuntimeSetting) {
  const values = setting.constraints?.enum
  return Array.isArray(values) ? values.filter((value): value is string | number => typeof value === 'string' || typeof value === 'number') : []
}

export function validateRuntimeSettingDraft(setting: RuntimeSetting, rawValue: string) {
  if (rawValue.trim() === '') {
    return 'A value is required.'
  }

  const choices = enumValues(setting)
  if (choices.length > 0 && !choices.some((choice) => String(choice) === rawValue)) {
    return `Choose one of: ${choices.join(', ')}.`
  }

  if (isNumericSetting(setting)) {
    const value = Number(rawValue)
    if (!Number.isFinite(value)) {
      return 'Enter a finite number.'
    }
    if (setting.valueType.toLowerCase().includes('int') && !Number.isInteger(value)) {
      return 'Enter a whole number.'
    }
    const min = setting.constraints?.min
    if (typeof min === 'number' && value < min) {
      return `Must be at least ${min}.`
    }
    const max = setting.constraints?.max
    if (typeof max === 'number' && value > max) {
      return `Must be at most ${max}.`
    }
  }

  try {
    parseRuntimeValue(setting, rawValue)
  } catch {
    return 'Enter a valid value.'
  }

  return null
}

export function changedCanonicalSettings(
  settings: RuntimeSetting[],
  state: ChunkingState | undefined,
  drafts: Record<string, string>,
) {
  return CANONICAL_CHUNKING_CONTROLS.flatMap((control) => {
    const setting = settings.find((item) => item.key === control.key)
    const effectiveValue = effectiveValueForControl(state, control)
    const draft = drafts[control.key]
    if (!setting || effectiveValue === undefined || draft === undefined || draft === formatChunkingValue(effectiveValue)) {
      return []
    }
    const validationError = validateRuntimeSettingDraft(setting, draft)
    if (validationError) return []
    return [{ key: control.key, value: parseRuntimeValue(setting, draft) }]
  })
}
