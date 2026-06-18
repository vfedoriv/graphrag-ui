import { useAiProfilesQuery } from '../../api/aiProfiles'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useRuntimeSettingsQuery } from '../../api/runtimeSettings'
import type { RuntimeSetting } from '../../api/types'
import { Notice } from './PrototypePrimitives'
import { StatusBadge } from './StatusBadge'

export function RuntimeContextSummary({
  knowledgeBaseId,
  settingHints,
  title,
}: {
  knowledgeBaseId: string | null
  settingHints: string[]
  title: string
}) {
  const knowledgeBasesQuery = useKnowledgeBasesQuery()
  const profilesQuery = useAiProfilesQuery()
  const settingsQuery = useRuntimeSettingsQuery()
  const knowledgeBases = Array.isArray(knowledgeBasesQuery.data) ? knowledgeBasesQuery.data : []
  const profiles = Array.isArray(profilesQuery.data) ? profilesQuery.data : []
  const settings = Array.isArray(settingsQuery.data) ? settingsQuery.data : []
  const activeKnowledgeBase = knowledgeBases.find((kb) => kb.id === knowledgeBaseId)
  const activeProfileId = activeKnowledgeBase?.activeAiProfileId ?? null
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId)
  const relevantSettings = settings.filter((setting) => matchesSettingHints(setting, settingHints)).slice(0, 6)

  return (
    <Notice title={title}>
      <span className='runtime-context-line'>
        <StatusBadge
          label={`AI profile: ${activeProfile?.name ?? activeProfileId ?? (profilesQuery.isError ? 'Unavailable' : 'None assigned')}`}
          tone={activeProfileId ? 'success' : 'warning'}
        />
        {settingsQuery.isError ? <StatusBadge label='Runtime settings unavailable' tone='warning' /> : null}
        {relevantSettings.map((setting) => (
          <StatusBadge
            key={setting.key}
            label={`${setting.label ?? setting.key}: ${formatSettingValue(setting)}`}
            tone='neutral'
          />
        ))}
      </span>
    </Notice>
  )
}

function matchesSettingHints(setting: RuntimeSetting, hints: string[]) {
  const key = String(setting.key ?? '').toLowerCase()
  const category = String(setting.category ?? '').toLowerCase()
  return hints.some((hint) => key.includes(hint) || category.includes(hint))
}

function formatSettingValue(setting: RuntimeSetting) {
  if (setting.sensitive) {
    return String(setting.currentValue ?? 'configured')
  }
  if (typeof setting.currentValue === 'string' || typeof setting.currentValue === 'number' || typeof setting.currentValue === 'boolean') {
    return String(setting.currentValue)
  }
  return JSON.stringify(setting.currentValue)
}
