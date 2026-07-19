import type { JsonValue } from '@visual-json/react'

export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonValueInternal(value, new Set())
}

function isJsonValueInternal(value: unknown, ancestors: Set<object>): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object') return false
  if (ancestors.has(value)) return false

  try {
    ancestors.add(value)
    const valid = Array.isArray(value)
      ? value.every((item) => isJsonValueInternal(item, ancestors))
      : (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
        && Object.values(value).every((item) => isJsonValueInternal(item, ancestors))
    ancestors.delete(value)
    return valid
  } catch {
    ancestors.delete(value)
    return false
  }
}
