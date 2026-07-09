import type { AiProfile, CreateAiProfileRequest, UpdateAiProfileRequest } from '../../api/types'

export type ProfileForm = {
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

export const emptyProfileForm: ProfileForm = {
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

export function toCreateProfilePayload(form: ProfileForm): CreateAiProfileRequest {
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

export function toUpdateProfilePayload(form: ProfileForm): UpdateAiProfileRequest {
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

export function profileToForm(profile: AiProfile): ProfileForm {
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
