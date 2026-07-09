import type { SchemaSourceType } from '../../api/types'

export function isSupportedSchemaSourceType(sourceType: string): sourceType is SchemaSourceType {
  return sourceType === 'PREDEFINED' || sourceType === 'GENERATED'
}

export function formatSchemaSourceTypeLabel(sourceType: string) {
  return isSupportedSchemaSourceType(sourceType) ? sourceType : `UNSUPPORTED (${sourceType})`
}

export function navigateToSchemaBuilder(url: string) {
  window.history.pushState({}, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
