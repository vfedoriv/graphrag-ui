import {
  formatEditableRuntimeValue,
  isAiProviderRuntimeSetting,
  isProfileManaged,
  isRuntimeSettingEditable,
  parseRuntimeValue,
} from './runtimeSettingsHelpers'
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
  it('partitions provider settings by normalized category or update mode', () => {
    const settings = [
      { ...baseSetting, key: 'provider-category', category: ' Provider ' },
      { ...baseSetting, key: 'profile-managed', category: 'runtime', updateMode: 'profile_managed' },
      { ...baseSetting, key: 'backend-profile-managed', category: 'spring-ai-openai', updateMode: 'profile-managed' },
      { ...baseSetting, key: 'general' },
    ]

    expect(isAiProviderRuntimeSetting(settings[0])).toBe(true)
    expect(isAiProviderRuntimeSetting(settings[1])).toBe(true)
    expect(isAiProviderRuntimeSetting(settings[2])).toBe(true)
    expect(isAiProviderRuntimeSetting(settings[3])).toBe(false)

    const providers = settings.filter(isAiProviderRuntimeSetting)
    const general = settings.filter((setting) => !isAiProviderRuntimeSetting(setting))
    expect([...providers, ...general].map((setting) => setting.key).sort()).toEqual(settings.map((setting) => setting.key).sort())
    expect(providers.some((setting) => general.includes(setting))).toBe(false)
  })

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
