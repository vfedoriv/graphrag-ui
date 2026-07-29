import { useAiProfilesQuery } from '../../api/aiProfiles'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useRuntimeSettingsQuery } from '../../api/runtimeSettings'
import { AiProfilesSection } from '../settings/AiProfilesSection'
import { RuntimeSettingsSection } from '../settings/RuntimeSettingsSection'
import { isAiProviderRuntimeSetting } from '../settings/runtimeSettingsHelpers'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'

export function AiProvidersPage() {
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null
  const runtimeSettingsQuery = useRuntimeSettingsQuery()
  const aiProfilesQuery = useAiProfilesQuery()
  const providerSettings = (runtimeSettingsQuery.data ?? []).filter(isAiProviderRuntimeSetting)

  return (
    <ControllerPage
      title='AI Providers'
      eyebrow='Provider control plane'
      description='Inspect provider-owned runtime properties and manage reusable AI profiles.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Selected workspace', value: activeKb?.name ?? selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'Active AI profile', value: activeKb?.activeAiProfileId ?? 'None assigned' },
            { label: 'Provider properties', value: runtimeSettingsQuery.isLoading ? 'Loading' : `${providerSettings.length} available` },
          ]}
        />
      }
      topSectionTitle='Provider configuration'
      topSectionDescription='Provider metadata remains backend-owned; profile-managed and sensitive values are changed through AI profiles.'
      topSectionStatus={<StatusBadge label={runtimeSettingsQuery.isLoading || aiProfilesQuery.isLoading ? 'Loading providers' : 'Provider catalog'} tone='neutral' />}
      topSection={
        <div className='stack-lg'>
          <OperationSpine
            ariaLabel='AI Providers status summary'
            items={[
              { eyebrow: 'Workspace', title: activeKb?.name ?? 'None selected', body: activeKb?.id ?? 'Select a knowledge base to inspect its active profile.' },
              { eyebrow: 'Active profile', title: activeKb?.activeAiProfileId ?? 'None assigned', body: 'Knowledge-base workflows use the assigned profile.' },
              { eyebrow: 'Provider properties', title: `${providerSettings.length} settings`, body: 'The catalog is selected from provider and profile-managed backend metadata.' },
              { eyebrow: 'Profiles', title: `${aiProfilesQuery.data?.length ?? 0} profiles`, body: 'API keys remain write-only while profile metadata stays inspectable.' },
            ]}
          />

          <RuntimeSettingsSection
            settings={providerSettings}
            isLoading={runtimeSettingsQuery.isLoading}
            error={runtimeSettingsQuery.error as Error | null}
          />

          <AiProfilesSection
            profiles={aiProfilesQuery.data ?? []}
            isLoading={aiProfilesQuery.isLoading}
            error={aiProfilesQuery.error as Error | null}
          />
        </div>
      }
      testId='ai-providers-controller-page'
    />
  )
}
