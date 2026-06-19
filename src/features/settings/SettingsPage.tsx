import { useMemo, useState, type FormEvent } from 'react'
import {
  useAiProfilesQuery,
  useCreateAiProfileMutation,
  useDeleteAiProfileMutation,
  useUpdateAiProfileMutation,
} from '../../api/aiProfiles'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import {
  useBulkUpdateRuntimeSettingsMutation,
  useClearRuntimeSettingMutation,
  useRuntimeSettingsQuery,
} from '../../api/runtimeSettings'
import type { AiProfile, CreateAiProfileRequest, RuntimeSetting, UpdateAiProfileRequest } from '../../api/types'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Input } from '../../shared/ui/Input'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'

const apiBasePath = '/api/v1'
const devProxyTarget = import.meta.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

type ProfileForm = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  chatModel: string
  embeddingModel: string
  embeddingDimensions: string
  timeoutSeconds: string
  retryCount: string
  defaultProfile: boolean
}

const emptyProfileForm: ProfileForm = {
  id: '',
  name: '',
  baseUrl: '',
  apiKey: '',
  chatModel: '',
  embeddingModel: '',
  embeddingDimensions: '1536',
  timeoutSeconds: '60',
  retryCount: '3',
  defaultProfile: false,
}

export function SettingsPage() {
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null
  const runtimeSettingsQuery = useRuntimeSettingsQuery()
  const aiProfilesQuery = useAiProfilesQuery()

  return (
    <ControllerPage
      title='Settings'
      eyebrow='Runtime control plane'
      description='Inspect and manage live backend runtime properties, AI profiles, and API gateway context.'
      workspaceStrip={
        <WorkspaceStrip
          items={[
            { label: 'Selected workspace', value: activeKb?.name ?? selectedKnowledgeBaseId ?? 'None selected' },
            { label: 'Active AI profile', value: activeKb?.activeAiProfileId ?? 'None assigned' },
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
              { eyebrow: 'AI profile', title: activeKb?.activeAiProfileId ?? 'None assigned', body: 'Knowledge-base workflows use their active profile when one is assigned.' },
            ]}
          />

          <RuntimeSettingsSection
            settings={runtimeSettingsQuery.data ?? []}
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
      testId='settings-controller-page'
    />
  )
}

function RuntimeSettingsSection({
  settings,
  isLoading,
  error,
}: {
  settings: RuntimeSetting[]
  isLoading: boolean
  error: Error | null
}) {
  const [category, setCategory] = useState('all')
  const [updateMode, setUpdateMode] = useState('all')
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [acceptedPendingValues, setAcceptedPendingValues] = useState<Record<string, unknown>>({})
  const [sectionMessage, setSectionMessage] = useState('')
  const bulkUpdateMutation = useBulkUpdateRuntimeSettingsMutation()
  const clearMutation = useClearRuntimeSettingMutation()

  const categories = useMemo(() => unique(settings.map((setting) => setting.category)), [settings])
  const updateModes = useMemo(() => unique(settings.map((setting) => setting.updateMode)), [settings])
  const filteredSettings = settings.filter((setting) => {
    const haystack = [
      setting.key,
      setting.label,
      setting.description,
      setting.category,
      setting.updateMode,
      setting.reason,
    ].filter(Boolean).join(' ').toLowerCase()
    return (
      (category === 'all' || setting.category === category) &&
      (updateMode === 'all' || setting.updateMode === updateMode) &&
      haystack.includes(search.trim().toLowerCase())
    )
  })

  const changedSettings = settings.filter((setting) => {
    if (!isRuntimeSettingEditable(setting)) return false
    const draft = drafts[setting.key]
    return draft !== undefined && draft !== formatEditableValue(setting.currentValue)
  })

  const applyChanges = async () => {
    const updates = changedSettings.map((setting) => ({
      key: setting.key,
      value: parseRuntimeValue(setting, drafts[setting.key] ?? formatEditableValue(setting.currentValue)),
    }))
    if (updates.length === 0) return
    try {
      const updatedSettings = await bulkUpdateMutation.mutateAsync({ updates })
      const submittedValues = new Map(updates.map((update) => [update.key, update.value]))
      setAcceptedPendingValues((current) => {
        const next = { ...current }
        for (const setting of updatedSettings) {
          if (setting.liveApplied) {
            delete next[setting.key]
          } else {
            next[setting.key] = submittedValues.get(setting.key) ?? setting.currentValue
          }
        }
        return next
      })
      setDrafts((current) => {
        const next = { ...current }
        for (const setting of updatedSettings) delete next[setting.key]
        return next
      })
      setSectionMessage(`${updatedSettings.length} runtime setting${updatedSettings.length === 1 ? '' : 's'} accepted`)
    } catch {
      // surfaced through mutation error
    }
  }

  const clearSetting = async (setting: RuntimeSetting) => {
    try {
      const updated = await clearMutation.mutateAsync(setting.key)
      setDrafts((current) => {
        const next = { ...current }
        delete next[setting.key]
        return next
      })
      setAcceptedPendingValues((current) => {
        const next = { ...current }
        if (updated.liveApplied) {
          delete next[setting.key]
        } else {
          next[setting.key] = updated.defaultValue
        }
        return next
      })
      setSectionMessage('Override clear accepted')
    } catch {
      // surfaced through mutation error
    }
  }

  return (
    <section className='flow-card' data-testid='runtime-settings-section'>
      <div className='panel-head compact'>
        <div>
          <p className='eyebrow'>Runtime properties</p>
          <h2>Backend settings catalog</h2>
        </div>
        <div className='row-actions'>
          <StatusBadge label={isLoading ? 'Loading' : `${settings.length} settings`} tone='neutral' />
          <Button
            type='button'
            variant='primary'
            isPending={bulkUpdateMutation.isPending}
            pendingText='Applying...'
            disabled={changedSettings.length === 0 || bulkUpdateMutation.isPending}
            onClick={() => void applyChanges()}
          >
            Apply changes
          </Button>
        </div>
      </div>

      {error ? (
        <Alert title='Runtime settings unavailable' message={`${error.message}. Frontend proxy base remains ${apiBasePath}.`} />
      ) : null}
      {bulkUpdateMutation.error ? <Alert title='Apply failed' message={(bulkUpdateMutation.error as Error).message} /> : null}
      {clearMutation.error ? <Alert title='Clear failed' message={(clearMutation.error as Error).message} /> : null}
      {sectionMessage ? <Alert title='Runtime settings updated' message={sectionMessage} tone='success' /> : null}

      <div className='settings-filters'>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value='all'>All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Update mode
          <select value={updateMode} onChange={(event) => setUpdateMode(event.target.value)}>
            <option value='all'>All modes</option>
            {updateModes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Search
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='key, label, reason' />
        </label>
      </div>

      {isLoading ? <p>Loading runtime settings...</p> : null}
      {!isLoading && filteredSettings.length === 0 ? <EmptyState title='No runtime settings' body='Adjust filters or check backend availability.' /> : null}
      {filteredSettings.length > 0 ? (
        <Table
          ariaLabel='Runtime settings'
          headers={['Setting', 'Value', 'Default', 'Metadata', 'Update']}
          rowKeys={filteredSettings.map((setting) => setting.key)}
          rows={filteredSettings.map((setting) => {
            const editable = isRuntimeSettingEditable(setting)
            const clearPending = clearMutation.isPending && clearMutation.variables === setting.key
            const draft = drafts[setting.key]
            const editableValue = draft ?? formatEditableValue(setting.currentValue)
            const modified = editable && draft !== undefined && draft !== formatEditableValue(setting.currentValue)
            const pendingValue = acceptedPendingValues[setting.key]

            return [
              <div className='stack'>
                <strong>{setting.label ?? setting.key}</strong>
                <code>{setting.key}</code>
                {setting.description ? <small>{setting.description}</small> : null}
                {isProfileManaged(setting) ? <a href='#ai-profiles-section'>Manage through AI profiles</a> : null}
              </div>,
              <RuntimeSettingValueCell
                setting={setting}
                draft={draft}
                pendingValue={pendingValue}
                modified={modified}
              />,
              <ValueDisplay setting={setting} value={setting.defaultValue} />,
              <div className='stack'>
                <div className='badge-row'>
                  <StatusBadge label={setting.category} tone='neutral' />
                  <StatusBadge label={setting.valueType} tone='neutral' />
                  <StatusBadge label={setting.source} tone='neutral' />
                  <StatusBadge label={setting.liveApplied ? 'Live applied' : 'Restart required'} tone={setting.liveApplied ? 'success' : 'warning'} />
                  {setting.sensitive ? <StatusBadge label='Sensitive' tone='warning' /> : null}
                </div>
                <small>{formatJson(setting.constraints) || 'No constraints'}</small>
                {!editable ? <small>{setting.reason ?? setting.updateMode}</small> : null}
              </div>,
              <div className='stack'>
                {editable ? (
                  <RuntimeSettingEditor
                    setting={setting}
                    value={editableValue}
                    onChange={(value) => {
                      setSectionMessage('')
                      setDrafts((current) => ({ ...current, [setting.key]: value }))
                    }}
                  />
                ) : (
                  <StatusBadge label={setting.updateMode} tone='warning' />
                )}
                <div className='row-actions'>
                  {editable ? (
                    <>
                      <Button
                        type='button'
                        variant='ghost'
                        className='table-action-button'
                        disabled={!modified || bulkUpdateMutation.isPending}
                        onClick={() => setDrafts((current) => {
                          const next = { ...current }
                          delete next[setting.key]
                          return next
                        })}
                      >
                        Reset
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        className='table-action-button'
                        isPending={clearPending}
                        pendingText='Clearing...'
                        disabled={bulkUpdateMutation.isPending || clearPending}
                        onClick={() => void clearSetting(setting)}
                      >
                        Clear
                      </Button>
                    </>
                  ) : null}
                </div>
                {modified ? <small>Modified</small> : null}
                {!editable ? <small>{setting.reason ?? setting.updateMode}</small> : null}
              </div>,
            ]
          })}
        />
      ) : null}
    </section>
  )
}

function AiProfilesSection({
  profiles,
  isLoading,
  error,
}: {
  profiles: AiProfile[]
  isLoading: boolean
  error: Error | null
}) {
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ProfileForm>(emptyProfileForm)
  const [replaceApiKey, setReplaceApiKey] = useState<Record<string, string>>({})
  const createMutation = useCreateAiProfileMutation()
  const updateMutation = useUpdateAiProfileMutation()
  const deleteMutation = useDeleteAiProfileMutation()

  const createProfile = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createMutation.mutateAsync(toCreateProfilePayload(form))
      setForm(emptyProfileForm)
    } catch {
      // surfaced below
    }
  }

  const startEdit = (profile: AiProfile) => {
    setEditingId(profile.id)
    setEditForm(profileToForm(profile))
  }

  const saveEdit = async (profile: AiProfile, apiKeyMode: 'preserve' | 'replace' | 'clear' = 'preserve') => {
    try {
      const payload = toUpdateProfilePayload(editForm)
      if (apiKeyMode === 'replace') {
        payload.apiKey = replaceApiKey[profile.id] ?? ''
      }
      if (apiKeyMode === 'clear') {
        payload.clearApiKey = true
      }
      await updateMutation.mutateAsync({ id: profile.id, payload })
      setEditingId(null)
      setReplaceApiKey((current) => ({ ...current, [profile.id]: '' }))
    } catch {
      // surfaced below
    }
  }

  const deleteProfile = async (profile: AiProfile) => {
    if (!window.confirm(`Delete AI profile "${profile.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(profile.id)
    } catch {
      // surfaced below
    }
  }

  return (
    <section className='flow-card' id='ai-profiles-section' data-testid='ai-profiles-section'>
      <div className='panel-head compact'>
        <div>
          <p className='eyebrow'>AI profiles</p>
          <h2>Provider profiles</h2>
        </div>
        <StatusBadge label={isLoading ? 'Loading' : `${profiles.length} profiles`} tone='neutral' />
      </div>

      {error ? <Alert title='AI profiles unavailable' message={error.message} /> : null}

      <form className='settings-form profile-form' onSubmit={createProfile}>
        <ProfileFields form={form} onChange={setForm} includeId />
        <Button type='submit' variant='primary' isPending={createMutation.isPending} pendingText='Creating...'>Create profile</Button>
      </form>
      {createMutation.error ? <Alert title='Create profile failed' message={(createMutation.error as Error).message} /> : null}

      {isLoading ? <p>Loading AI profiles...</p> : null}
      {!isLoading && profiles.length === 0 ? <EmptyState title='No AI profiles' body='Create a profile before assigning one to a knowledge base.' /> : null}
      {profiles.length > 0 ? (
        <Table
          ariaLabel='AI profiles'
          headers={['Profile', 'Models', 'API key', 'Runtime', 'Actions']}
          rowKeys={profiles.map((profile) => profile.id)}
          rows={profiles.map((profile) => {
            const isEditing = editingId === profile.id
            const isUpdating = updateMutation.isPending && updateMutation.variables?.id === profile.id
            return [
              isEditing ? <ProfileFields form={editForm} onChange={setEditForm} /> : (
                <div className='stack'>
                  <strong>{profile.name}</strong>
                  <code>{profile.id}</code>
                  <small>{profile.baseUrl}</small>
                  {profile.defaultProfile ? <StatusBadge label='Default' tone='success' /> : null}
                </div>
              ),
              <div className='stack'>
                <span>{profile.chatModel}</span>
                <small>{profile.embeddingModel} ({profile.embeddingDimensions})</small>
              </div>,
              <div className='stack'>
                <StatusBadge label={profile.apiKeyConfigured ? 'Configured' : 'Not configured'} tone={profile.apiKeyConfigured ? 'success' : 'warning'} />
                <small>{profile.apiKeyMask ?? 'No mask provided'}</small>
                {isEditing ? (
                  <Input
                    value={replaceApiKey[profile.id] ?? ''}
                    onChange={(event) => setReplaceApiKey((current) => ({ ...current, [profile.id]: event.target.value }))}
                    placeholder='Replacement API key'
                    aria-label={`Replacement API key for ${profile.name}`}
                    type='password'
                  />
                ) : null}
              </div>,
              <div className='stack'>
                <span>Timeout {profile.timeoutSeconds}s</span>
                <small>Retries {profile.retryCount} · Revision {profile.revision ?? 'n/a'}</small>
                <small>{profile.updatedAt ?? profile.createdAt ?? 'No timestamp'}</small>
              </div>,
              <div className='row-actions'>
                {isEditing ? (
                  <>
                    <Button type='button' variant='primary' className='table-action-button' isPending={isUpdating} pendingText='Saving...' onClick={() => void saveEdit(profile)}>
                      Save
                    </Button>
                    <Button type='button' variant='ghost' className='table-action-button' disabled={isUpdating || !replaceApiKey[profile.id]} onClick={() => void saveEdit(profile, 'replace')}>
                      Replace key
                    </Button>
                    <Button type='button' variant='ghost' className='table-action-button' disabled={isUpdating || !profile.apiKeyConfigured} onClick={() => void saveEdit(profile, 'clear')}>
                      Clear key
                    </Button>
                    <Button type='button' variant='ghost' className='table-action-button' disabled={isUpdating} onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type='button' variant='ghost' className='table-action-button' onClick={() => startEdit(profile)}>Edit</Button>
                    <Button
                      type='button'
                      variant='danger'
                      className='table-action-button'
                      isPending={deleteMutation.isPending && deleteMutation.variables === profile.id}
                      pendingText='Deleting...'
                      onClick={() => void deleteProfile(profile)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>,
            ]
          })}
        />
      ) : null}
      {updateMutation.error ? <Alert title='Update profile failed' message={(updateMutation.error as Error).message} /> : null}
      {deleteMutation.error ? <Alert title='Delete profile failed' message={(deleteMutation.error as Error).message} /> : null}
    </section>
  )
}

function ProfileFields({
  form,
  onChange,
  includeId = false,
}: {
  form: ProfileForm
  onChange: (form: ProfileForm) => void
  includeId?: boolean
}) {
  const set = (key: keyof ProfileForm, value: string | boolean) => onChange({ ...form, [key]: value })

  return (
    <>
      {includeId ? (
        <label>
          Profile ID
          <Input value={form.id} onChange={(event) => set('id', event.target.value)} required />
        </label>
      ) : null}
      <label>
        Name
        <Input value={form.name} onChange={(event) => set('name', event.target.value)} required />
      </label>
      <label>
        Base URL
        <Input value={form.baseUrl} onChange={(event) => set('baseUrl', event.target.value)} required />
      </label>
      {includeId ? (
        <label>
          API key
          <Input value={form.apiKey} onChange={(event) => set('apiKey', event.target.value)} type='password' />
        </label>
      ) : null}
      <label>
        Chat model
        <Input value={form.chatModel} onChange={(event) => set('chatModel', event.target.value)} required />
      </label>
      <label>
        Embedding model
        <Input value={form.embeddingModel} onChange={(event) => set('embeddingModel', event.target.value)} required />
      </label>
      <label>
        Embedding dimensions
        <Input value={form.embeddingDimensions} onChange={(event) => set('embeddingDimensions', event.target.value)} type='number' required />
      </label>
      <label>
        Timeout seconds
        <Input value={form.timeoutSeconds} onChange={(event) => set('timeoutSeconds', event.target.value)} type='number' required />
      </label>
      <label>
        Retry count
        <Input value={form.retryCount} onChange={(event) => set('retryCount', event.target.value)} type='number' required />
      </label>
      <label className='check-row'>
        <input checked={form.defaultProfile} onChange={(event) => set('defaultProfile', event.target.checked)} type='checkbox' />
        Default profile
      </label>
    </>
  )
}

function RuntimeSettingEditor({
  setting,
  value,
  onChange,
}: {
  setting: RuntimeSetting
  value: string
  onChange: (value: string) => void
}) {
  if (setting.valueType.toLowerCase().includes('bool')) {
    return (
      <label className='check-row'>
        <input checked={value === 'true'} onChange={(event) => onChange(String(event.target.checked))} type='checkbox' />
        Enabled
      </label>
    )
  }

  if (isNumericSetting(setting)) {
    return (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type='number'
        min={constraintNumber(setting, 'min')}
        max={constraintNumber(setting, 'max')}
        aria-label={`Value for ${setting.key}`}
      />
    )
  }

  if (isJsonSetting(setting)) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`JSON value for ${setting.key}`}
        rows={5}
      />
    )
  }

  return <Input value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Value for ${setting.key}`} />
}

function ValueDisplay({ setting, value }: { setting: RuntimeSetting; value: unknown }) {
  if (setting.sensitive) {
    return <StatusBadge label={String(value ?? 'Configured')} tone='warning' />
  }
  return <code>{formatJson(value) || 'None'}</code>
}

function RuntimeSettingValueCell({
  setting,
  draft,
  pendingValue,
  modified,
}: {
  setting: RuntimeSetting
  draft?: string
  pendingValue?: unknown
  modified: boolean
}) {
  const restartRequired = !setting.liveApplied
  return (
    <div className='stack'>
      <small>Active</small>
      <ValueDisplay setting={setting} value={setting.currentValue} />
      {modified ? (
        <>
          <small>{restartRequired ? 'Draft pending restart' : 'Draft'}</small>
          <code>{draft || 'None'}</code>
        </>
      ) : null}
      {!modified && restartRequired && pendingValue !== undefined ? (
        <>
          <small>Accepted pending restart</small>
          <ValueDisplay setting={setting} value={pendingValue} />
        </>
      ) : null}
      {restartRequired && (modified || pendingValue !== undefined) ? (
        <StatusBadge label='Restart required before active' tone='warning' />
      ) : null}
    </div>
  )
}

function isRuntimeSettingEditable(setting: RuntimeSetting) {
  return setting.mutable && !setting.sensitive && !isProfileManaged(setting)
}

function isProfileManaged(setting: RuntimeSetting) {
  return setting.updateMode.toLowerCase().includes('profile') || setting.reason?.toLowerCase().includes('profile')
}

function parseRuntimeValue(setting: RuntimeSetting, value: string) {
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

function formatEditableValue(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value ?? null, null, 2)
}

function formatJson(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function isNumericSetting(setting: RuntimeSetting) {
  const type = setting.valueType.toLowerCase()
  return type.includes('number') || type.includes('integer') || type.includes('int') || type.includes('double')
}

function isJsonSetting(setting: RuntimeSetting) {
  const type = setting.valueType.toLowerCase()
  return type.includes('json') || type.includes('object') || type.includes('array')
}

function constraintNumber(setting: RuntimeSetting, key: 'min' | 'max') {
  const value = setting.constraints?.[key]
  return typeof value === 'number' ? value : undefined
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function toCreateProfilePayload(form: ProfileForm): CreateAiProfileRequest {
  return {
    id: form.id,
    name: form.name,
    baseUrl: form.baseUrl,
    apiKey: form.apiKey || undefined,
    chatModel: form.chatModel,
    embeddingModel: form.embeddingModel,
    embeddingDimensions: Number(form.embeddingDimensions),
    timeoutSeconds: Number(form.timeoutSeconds),
    retryCount: Number(form.retryCount),
    defaultProfile: form.defaultProfile,
  }
}

function toUpdateProfilePayload(form: ProfileForm): UpdateAiProfileRequest {
  return {
    name: form.name,
    baseUrl: form.baseUrl,
    chatModel: form.chatModel,
    embeddingModel: form.embeddingModel,
    embeddingDimensions: Number(form.embeddingDimensions),
    timeoutSeconds: Number(form.timeoutSeconds),
    retryCount: Number(form.retryCount),
    defaultProfile: form.defaultProfile,
  }
}

function profileToForm(profile: AiProfile): ProfileForm {
  return {
    id: profile.id,
    name: profile.name,
    baseUrl: profile.baseUrl,
    apiKey: '',
    chatModel: profile.chatModel,
    embeddingModel: profile.embeddingModel,
    embeddingDimensions: String(profile.embeddingDimensions),
    timeoutSeconds: String(profile.timeoutSeconds),
    retryCount: String(profile.retryCount),
    defaultProfile: profile.defaultProfile,
  }
}
