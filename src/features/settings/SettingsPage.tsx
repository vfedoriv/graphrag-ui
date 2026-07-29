import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useRuntimeSettingsQuery } from '../../api/runtimeSettings'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { RuntimeSettingsSection } from './RuntimeSettingsSection'
import { isAiProviderRuntimeSetting } from './runtimeSettingsHelpers'

const apiBasePath = '/api/v1'
const devProxyTarget = import.meta.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

export function SettingsPage() {
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null
  const runtimeSettingsQuery = useRuntimeSettingsQuery()
  const settings = (runtimeSettingsQuery.data ?? []).filter((setting) => !isAiProviderRuntimeSetting(setting))

  return (
    <ControllerPage
      title='Settings'
      eyebrow='Runtime control plane'
      description='Inspect and manage general backend runtime properties and API gateway context.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Selected workspace', value: activeKb?.name ?? selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'Runtime properties', value: runtimeSettingsQuery.isLoading ? 'Loading' : `${settings.length} available` },
            { label: 'API base', value: apiBasePath },
          ]}
        />
      }
      topSectionTitle='Runtime configuration'
      topSectionDescription='Backend-owned runtime settings are editable when the API marks them mutable; restart-required changes are staged before backend restart.'
      topSectionStatus={<StatusBadge label={runtimeSettingsQuery.isLoading ? 'Loading settings' : 'Live catalog'} tone='neutral' />}
      topSection={
        <div className='stack-lg'>
          <OperationSpine
            ariaLabel='Settings status summary'
            items={[
              { eyebrow: 'Gateway', title: apiBasePath, body: 'All frontend API calls are routed through the same-origin API base path.' },
              { eyebrow: 'Development proxy', title: devProxyTarget, body: 'Local /api traffic is proxied to this target by Vite.' },
              { eyebrow: 'Workspace', title: activeKb?.name ?? 'None selected', body: activeKb?.id ?? 'Select a knowledge base to scope controller requests.' },
              { eyebrow: 'Catalog scope', title: `${settings.length} properties`, body: 'AI provider properties are managed from the dedicated AI Providers workspace.' },
            ]}
          />

          <RuntimeSettingsSection
            settings={settings}
            isLoading={runtimeSettingsQuery.isLoading}
            error={runtimeSettingsQuery.error as Error | null}
          />
        </div>
      }
      testId='settings-controller-page'
    />
  )
}
