import type { RuntimeSetting } from '../../api/types'

export function isRuntimeSettingEditable(setting: RuntimeSetting) {
  return setting.mutable && !setting.sensitive && !isProfileManaged(setting)
}

export function isProfileManaged(setting: RuntimeSetting) {
  return setting.updateMode.toLowerCase().includes('profile') || setting.reason?.toLowerCase().includes('profile')
}

export function parseRuntimeValue(setting: RuntimeSetting, value: string) {
  if (setting.valueType.toLowerCase().includes('bool')) {
    return value === 'true'
  }
  if (isNumericSetting(setting)) {
    return Number(value)
  }
  if (isJsonSetting(setting)) {
    return JSON.parse(value)
  }
  return value
}

export function formatEditableRuntimeValue(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value ?? null, null, 2)
}

export function formatRuntimeJson(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function isNumericSetting(setting: RuntimeSetting) {
  const type = setting.valueType.toLowerCase()
  return type.includes('number') || type.includes('integer') || type.includes('int') || type.includes('double')
}

export function isJsonSetting(setting: RuntimeSetting) {
  const type = setting.valueType.toLowerCase()
  return type.includes('json') || type.includes('object') || type.includes('array')
}

export function constraintNumber(setting: RuntimeSetting, key: 'min' | 'max') {
  const value = setting.constraints?.[key]
  return typeof value === 'number' ? value : undefined
}
