import { useState, type FormEvent } from 'react'
import {
  useCreateAiProfileMutation,
  useDeleteAiProfileMutation,
  useUpdateAiProfileMutation,
} from '../../api/aiProfiles'
import type { AiProfile } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { Input } from '../../shared/ui/Input'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { Table } from '../../shared/ui/Table'
import {
  emptyProfileForm,
  profileToForm,
  toCreateProfilePayload,
  toUpdateProfilePayload,
  type ProfileForm,
} from './aiProfileForm'

export function AiProfilesSection({
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
                <small>Retries {profile.maxRetries} · Revision {profile.revision ?? 'n/a'}</small>
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
        Max retries
        <Input value={form.maxRetries} onChange={(event) => set('maxRetries', event.target.value)} type='number' min={0} required />
      </label>
      <label className='check-row'>
        <input checked={form.defaultProfile} onChange={(event) => set('defaultProfile', event.target.checked)} type='checkbox' />
        Default profile
      </label>
    </>
  )
}
