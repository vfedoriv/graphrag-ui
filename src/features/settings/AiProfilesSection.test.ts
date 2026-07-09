import { emptyProfileForm, profileToForm, toCreateProfilePayload, toUpdateProfilePayload } from './aiProfileForm'
import type { AiProfile } from '../../api/types'

const profile: AiProfile = {
  id: 'default',
  name: 'Default profile',
  baseUrl: 'https://api.openai.com/v1',
  chatModel: 'gpt-4.1-mini',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  timeoutSeconds: 60,
  retryCount: 3,
  defaultProfile: true,
  revision: 1,
  apiKeyConfigured: true,
  apiKeyMask: 'sk-...1234',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

describe('AI profile form conversion', () => {
  it('converts create and update form payloads with numeric fields', () => {
    const form = {
      ...emptyProfileForm,
      id: 'created',
      name: 'Created',
      baseUrl: 'https://example.test/v1',
      apiKey: '',
      chatModel: 'chat',
      embeddingModel: 'embed',
      embeddingDimensions: '768',
      timeoutSeconds: '30',
      retryCount: '2',
      defaultProfile: true,
    }

    expect(toCreateProfilePayload(form)).toEqual({
      id: 'created',
      name: 'Created',
      baseUrl: 'https://example.test/v1',
      apiKey: undefined,
      chatModel: 'chat',
      embeddingModel: 'embed',
      embeddingDimensions: 768,
      timeoutSeconds: 30,
      retryCount: 2,
      defaultProfile: true,
    })
    expect(toUpdateProfilePayload(form)).toEqual({
      name: 'Created',
      baseUrl: 'https://example.test/v1',
      chatModel: 'chat',
      embeddingModel: 'embed',
      embeddingDimensions: 768,
      timeoutSeconds: 30,
      retryCount: 2,
      defaultProfile: true,
    })
  })

  it('maps an existing profile into an edit form without exposing the key', () => {
    expect(profileToForm(profile)).toEqual({
      id: 'default',
      name: 'Default profile',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      chatModel: 'gpt-4.1-mini',
      embeddingModel: 'text-embedding-3-small',
      embeddingDimensions: '1536',
      timeoutSeconds: '60',
      retryCount: '3',
      defaultProfile: true,
    })
  })
})
