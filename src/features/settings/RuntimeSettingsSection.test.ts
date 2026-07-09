import { formatEditableRuntimeValue, isProfileManaged, isRuntimeSettingEditable, parseRuntimeValue } from './runtimeSettingsHelpers'
import type { RuntimeSetting } from '../../api/types'

const baseSetting: RuntimeSetting = {
  key: 'query.topK',
  category: 'query',
  valueType: 'INTEGER',
  currentValue: 5,
  defaultValue: 10,
  source: 'PERSISTED',
  mutable: true,
  liveApplied: true,
  sensitive: false,
  constraints: { min: 1, max: 20 },
  updateMode: 'LIVE',
  label: 'Query top K',
}

describe('runtime settings helpers', () => {
  it('parses runtime draft values by declared type', () => {
    expect(parseRuntimeValue({ ...baseSetting, valueType: 'BOOLEAN' }, 'true')).toBe(true)
    expect(parseRuntimeValue({ ...baseSetting, valueType: 'INTEGER' }, '12')).toBe(12)
    expect(parseRuntimeValue({ ...baseSetting, valueType: 'JSON' }, '{"enabled":true}')).toEqual({ enabled: true })
    expect(parseRuntimeValue({ ...baseSetting, valueType: 'STRING' }, 'raw')).toBe('raw')
  })

  it('formats editable values and blocks non-editable settings', () => {
    expect(formatEditableRuntimeValue({ nested: true })).toBe('{\n  "nested": true\n}')
    expect(formatEditableRuntimeValue(null)).toBe('null')
    expect(isRuntimeSettingEditable(baseSetting)).toBe(true)
    expect(isRuntimeSettingEditable({ ...baseSetting, sensitive: true })).toBe(false)
    expect(isRuntimeSettingEditable({ ...baseSetting, updateMode: 'PROFILE_MANAGED' })).toBe(false)
    expect(isProfileManaged({ ...baseSetting, reason: 'Managed through AI profiles.' })).toBe(true)
  })
})
