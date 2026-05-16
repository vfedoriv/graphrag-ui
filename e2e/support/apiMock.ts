import type { Page, Request, Route } from '@playwright/test'
import {
  askFixture,
  chunksFixture,
  documentsFixture,
  executionFixture,
  generatedQueryFixture,
  knowledgeBasesFixture,
  queryValidationFixture,
  schemaContent,
  schemasFixture,
} from './fixtures'
import type { DocumentUpload, KnowledgeBase, Schema } from '../../src/api/types'

type ApiMockState = {
  knowledgeBases: KnowledgeBase[]
  schemas: Schema[]
  documentsByKnowledgeBase: Record<string, DocumentUpload[]>
  unhandled: string[]
  requests: string[]
}

export type GraphRagApiMock = ApiMockState & {
  selectedKnowledgeBaseRequests: (knowledgeBaseId: string) => string[]
}

export async function mockGraphRagApi(page: Page): Promise<GraphRagApiMock> {
  const state: ApiMockState = {
    knowledgeBases: structuredClone(knowledgeBasesFixture),
    schemas: structuredClone(schemasFixture),
    documentsByKnowledgeBase: {
      'kb-alpha': structuredClone(documentsFixture),
      'kb-beta': [],
    },
    unhandled: [],
    requests: [],
  }

  await page.route('**/api/v1/**', async (route) => {
    await handleApiRoute(route, state)
  })

  return {
    ...state,
    selectedKnowledgeBaseRequests: (knowledgeBaseId: string) =>
      state.requests.filter((request) => request.includes(`/knowledge-bases/${knowledgeBaseId}/`)),
  }
}

async function handleApiRoute(route: Route, state: ApiMockState) {
  const request = route.request()
  const method = request.method()
  const url = new URL(request.url())
  const path = url.pathname.replace('/api/v1', '')
  const key = `${method} ${path}${url.search}`
  state.requests.push(key)

  if (method === 'GET' && path === '/knowledge-bases') {
    await json(route, state.knowledgeBases)
    return
  }

  if (method === 'POST' && path === '/knowledge-bases') {
    const payload = request.postDataJSON() as { id: string, name: string }
    if (payload.id === 'kb-error') {
      await problem(route, 400, 'Create failed', 'Knowledge base ID is reserved for error coverage.')
      return
    }
    const created: KnowledgeBase = {
      id: payload.id,
      name: payload.name,
      activeSchemaId: null,
      createdAt: '2026-05-06T10:00:00.000Z',
    }
    state.knowledgeBases.push(created)
    await json(route, created, 201)
    return
  }

  const knowledgeBaseMatch = path.match(/^\/knowledge-bases\/([^/]+)$/)
  if (knowledgeBaseMatch && method === 'PUT') {
    const payload = request.postDataJSON() as { name: string }
    const kb = state.knowledgeBases.find((item) => item.id === knowledgeBaseMatch[1])
    if (!kb) {
      await problem(route, 404, 'Not found', 'Knowledge base was not found.')
      return
    }
    kb.name = payload.name
    await json(route, kb)
    return
  }

  if (knowledgeBaseMatch && method === 'DELETE') {
    state.knowledgeBases = state.knowledgeBases.filter((item) => item.id !== knowledgeBaseMatch[1])
    await route.fulfill({ status: 204 })
    return
  }

  if (method === 'GET' && path === '/schemas') {
    await json(route, state.schemas)
    return
  }

  if (method === 'POST' && path === '/schemas/validate') {
    await json(route, { valid: true, errors: [] })
    return
  }

  if (method === 'POST' && path === '/schemas') {
    const created: Schema = {
      id: 'schema-created',
      name: 'Created schema',
      version: 2,
      sourceType: 'PREDEFINED',
      format: 'JSON',
      contentHash: 'hash-created',
      status: 'DRAFT',
      createdAt: '2026-05-06T11:00:00.000Z',
    }
    state.schemas.push(created)
    await json(route, created, 201)
    return
  }

  const schemaActivationMatch = path.match(/^\/knowledge-bases\/([^/]+)\/schemas\/([^/]+)\/activate$/)
  if (schemaActivationMatch && method === 'POST') {
    const kb = state.knowledgeBases.find((item) => item.id === schemaActivationMatch[1])
    if (kb) kb.activeSchemaId = schemaActivationMatch[2]
    await route.fulfill({ status: 204 })
    return
  }

  const schemaByIdMatch = path.match(/^\/schemas\/([^/]+)$/)
  if (schemaByIdMatch && method === 'GET') {
    const schema = state.schemas.find((item) => item.id === schemaByIdMatch[1])
    if (!schema) {
      await problem(route, 404, 'Not found', 'Schema was not found.')
      return
    }
    await json(route, { ...schema, content: schemaContent })
    return
  }

  const documentsMatch = path.match(/^\/knowledge-bases\/([^/]+)\/documents$/)
  if (documentsMatch && method === 'GET') {
    await json(route, state.documentsByKnowledgeBase[documentsMatch[1]] ?? [])
    return
  }

  if (documentsMatch && method === 'POST') {
    const kbId = documentsMatch[1]
    const uploaded: DocumentUpload = {
      id: 'doc-uploaded',
      knowledgeBaseId: kbId,
      originalFilename: multipartFilename(request) ?? 'uploaded.txt',
      contentType: 'text/plain',
      sizeBytes: 32,
      sha256: 'sha-uploaded',
      contentUri: 'memory://uploaded.txt',
      status: 'UPLOADED',
      uploadedAt: '2026-05-06T12:00:00.000Z',
      processedAt: null,
      errorMessage: null,
    }
    state.documentsByKnowledgeBase[kbId] = [...(state.documentsByKnowledgeBase[kbId] ?? []), uploaded]
    await json(route, uploaded, 201)
    return
  }

  const processMatch = path.match(/^\/documents\/([^/]+)\/process$/)
  if (processMatch && method === 'POST') {
    const doc = Object.values(state.documentsByKnowledgeBase).flat().find((item) => item.id === processMatch[1])
    if (!doc) {
      await problem(route, 404, 'Not found', 'Document was not found.')
      return
    }
    doc.status = 'PROCESSED'
    doc.processedAt = '2026-05-06T13:00:00.000Z'
    await json(route, doc)
    return
  }

  const chunksMatch = path.match(/^\/documents\/([^/]+)\/chunks$/)
  if (chunksMatch && method === 'GET') {
    await json(route, chunksFixture.map((chunk) => ({ ...chunk, documentId: chunksMatch[1] })))
    return
  }

  const queryMatch = path.match(/^\/knowledge-bases\/([^/]+)\/queries\/(ask|generate|validate|execute)$/)
  if (queryMatch && method === 'POST') {
    const action = queryMatch[2]
    if (action === 'ask') await json(route, askFixture)
    if (action === 'generate') await json(route, generatedQueryFixture)
    if (action === 'validate') await json(route, queryValidationFixture)
    if (action === 'execute') await json(route, executionFixture)
    return
  }

  state.unhandled.push(key)
  await problem(route, 500, 'Unhandled API mock', `No Playwright API mock handled ${key}`)
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, json: body })
}

async function problem(route: Route, status: number, title: string, detail: string) {
  await route.fulfill({
    status,
    json: {
      title,
      status,
      detail,
    },
  })
}

function multipartFilename(request: Request) {
  const body = request.postData() ?? ''
  return /filename="([^"]+)"/.exec(body)?.[1]
}
