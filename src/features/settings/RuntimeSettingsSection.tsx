import { useMemo, useState } from 'react'
import {
  useBulkUpdateRuntimeSettingsMutation,
  useClearRuntimeSettingMutation,
} from '../../api/runtimeSettings'
import type { RuntimeSetting } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Input } from '../../shared/ui/Input'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import {
  constraintNumber,
  formatEditableRuntimeValue,
  formatRuntimeJson,
  isJsonSetting,
  isNumericSetting,
  isProfileManaged,
  isRuntimeSettingEditable,
  parseRuntimeValue,
} from './runtimeSettingsHelpers'

const apiBasePath = '/api/v1'

export function RuntimeSettingsSection({
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
    return draft !== undefined && draft !== formatEditableRuntimeValue(setting.currentValue)
  })

  const applyChanges = async () => {
    const updates = changedSettings.map((setting) => ({
      key: setting.key,
      value: parseRuntimeValue(setting, drafts[setting.key] ?? formatEditableRuntimeValue(setting.currentValue)),
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
            const editableValue = draft ?? formatEditableRuntimeValue(setting.currentValue)
            const modified = editable && draft !== undefined && draft !== formatEditableRuntimeValue(setting.currentValue)
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
                <small>{formatRuntimeJson(setting.constraints) || 'No constraints'}</small>
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
  return <code>{formatRuntimeJson(value) || 'None'}</code>
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

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}
