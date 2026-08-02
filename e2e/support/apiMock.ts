import type { Page, Request, Route } from '@playwright/test'
import {
  aiProfilesFixture,
  askFixture,
  chunksFixture,
  documentsFixture,
  executionFixture,
  generatedQueryFixture,
  knowledgeBasesFixture,
  queryValidationFixture,
  runtimeSettingsFixture,
  schemaContent,
  schemasFixture,
} from './fixtures'
import type { AdvancedSearchRunDetail, DocumentUpload, KnowledgeBase, Schema } from '../../src/api/types'

type ApiMockState = {
  knowledgeBases: KnowledgeBase[]
  schemas: Schema[]
  schemasByKnowledgeBase: Record<string, Schema[]>
  documentsByKnowledgeBase: Record<string, DocumentUpload[]>
  unhandled: string[]
  requests: string[]
  failOnceByRequest: Record<string, string>
  migrationPreview: Record<string, unknown>
  migrationHistory: Record<string, unknown>
  migrationPlan: Record<string, unknown>
  migrationCreateBodies: unknown[]
  migrationRetryBodies: unknown[]
  advancedSearchRuns: AdvancedSearchRunDetail[]
  advancedSearchCreateBodies: unknown[]
}

export type GraphRagApiMock = ApiMockState & {
  selectedKnowledgeBaseRequests: (knowledgeBaseId: string) => string[]
  failOnce: (request: string, detail: string) => void
}

export async function mockGraphRagApi(page: Page): Promise<GraphRagApiMock> {
  const state: ApiMockState = {
    knowledgeBases: structuredClone(knowledgeBasesFixture),
    schemas: structuredClone(schemasFixture),
    schemasByKnowledgeBase: {
      'kb-alpha': structuredClone(schemasFixture),
      'kb-beta': [],
    },
    documentsByKnowledgeBase: {
      'kb-alpha': structuredClone(documentsFixture),
      'kb-beta': [],
    },
    unhandled: [],
    requests: [],
    failOnceByRequest: {},
    migrationPreview: {
      knowledgeBaseId: 'kb-alpha', selection: 'OUTDATED_STRATEGY', ready: true, blockers: [],
      target: { schemaId: 'schema-customer', schemaContentHash: 'hash-customer', aiProfileId: 'default', aiProfileRevision: 1, embeddingSpaceId: 'embedding-test', expectedChunkerRevision: 'chunker-v2' },
      classificationCounts: { noChunks: 0, outdated: 1, current: 0 }, selectedCount: 1,
      selectedDocuments: { page: 0, size: 10, totalElements: 1, content: [{ id: 'doc-alpha', originalFilename: 'alpha-notes.txt', sha256: 'sha-alpha', uploadedAt: '2026-05-04T10:00:00.000Z', classification: 'OUTDATED', effectiveChunkerRevision: 'chunker-v1', parserRevision: 'parser-v1' }] },
    },
    migrationHistory: { page: 0, size: 10, totalElements: 0, content: [] },
    migrationPlan: {
      id: 'plan-1', reason: 'CHUNK_STRATEGY_MIGRATION', selection: 'OUTDATED_STRATEGY', expectedChunkerRevision: 'chunker-v2', status: 'PARTIAL', draftId: null, knowledgeBaseId: 'kb-alpha', schemaId: 'schema-customer', schemaContentHash: 'hash-customer', aiProfileId: 'default', aiProfileRevision: 1, retryOfPlanId: null,
      totalDocuments: 1, queuedDocuments: 0, runningDocuments: 0, succeededDocuments: 0, failedDocuments: 0, staleDocuments: 1, blockedDocuments: 0, createdAt: '2026-05-06T14:00:00.000Z', startedAt: '2026-05-06T14:00:01.000Z', completedAt: '2026-05-06T14:01:00.000Z', targetCurrent: true, retryable: true,
      items: { page: 0, size: 10, totalElements: 1, content: [{ id: 'migration-item-1', documentId: 'doc-alpha', documentSha256: 'sha-alpha', status: 'STALE_SOURCE', failureCategory: 'SOURCE_CHANGED', retryable: true, priorItemId: null, startedAt: null, completedAt: null }] },
    },
    migrationCreateBodies: [],
    migrationRetryBodies: [],
    advancedSearchRuns: [],
    advancedSearchCreateBodies: [],
  }

  await page.route('**/api/v1/**', async (route) => {
    await handleApiRoute(route, state)
  })

  return {
    ...state,
    selectedKnowledgeBaseRequests: (knowledgeBaseId: string) =>
      state.requests.filter((request) => request.includes(`/knowledge-bases/${knowledgeBaseId}/`)),
    failOnce: (request: string, detail: string) => {
      state.failOnceByRequest[request] = detail
    },
  }
}

async function handleApiRoute(route: Route, state: ApiMockState) {
  const request = route.request()
  const method = request.method()
  const url = new URL(request.url())
  const path = url.pathname.replace('/api/v1', '')
  const key = `${method} ${path}${url.search}`
  state.requests.push(key)
  const failureDetail = state.failOnceByRequest[key]
  if (failureDetail) {
    delete state.failOnceByRequest[key]
    await problem(route, 500, 'Mock failure', failureDetail)
    return
  }

  if (method === 'GET' && path === '/knowledge-bases') {
    await json(route, state.knowledgeBases)
    return
  }

  if (method === 'GET' && path === '/runtime-settings') {
    await json(route, runtimeSettingsFixture)
    return
  }

  if (method === 'GET' && path === '/ai-profiles') {
    await json(route, aiProfilesFixture)
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

  const knowledgeBaseSchemasMatch = path.match(/^\/knowledge-bases\/([^/]+)\/schemas$/)
  if (knowledgeBaseSchemasMatch && method === 'GET') {
    const kb = state.knowledgeBases.find((item) => item.id === knowledgeBaseSchemasMatch[1])
    if (!kb) {
      await problem(route, 404, 'Not found', 'Knowledge base was not found.')
      return
    }
    await json(route, state.schemasByKnowledgeBase[knowledgeBaseSchemasMatch[1]] ?? [])
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
    state.schemasByKnowledgeBase['kb-alpha'] = [...(state.schemasByKnowledgeBase['kb-alpha'] ?? []), created]
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

  const processingOptionsMatch = path.match(/^\/documents\/([^/]+)\/processing-options$/)
  if (processingOptionsMatch && method === 'GET') {
    await json(route, { documentId: processingOptionsMatch[1], parserId: 'text', fileFormat: 'txt', savedDefaults: null, savedDefaultsUpdatedAt: null, options: [] })
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
  const hierarchyMatch = path.match(/^\/documents\/([^/]+)\/chunks\/hierarchy$/)
  if (hierarchyMatch && method === 'GET') {
    await json(route, { page: Number(url.searchParams.get('page') ?? '0'), size: Number(url.searchParams.get('size') ?? '20'), totalElements: 0, content: [], flatChunkCount: chunksFixture.length })
    return
  }

  const pageMatch = path.match(/^\/documents\/([^/]+)\/chunks\/page$/)
  if (pageMatch && method === 'GET') {
    const content = chunksFixture.map((chunk) => ({ ...chunk, documentId: pageMatch[1], kind: 'FLAT' }))
    await json(route, { page: Number(url.searchParams.get('page') ?? '0'), size: Number(url.searchParams.get('size') ?? '20'), totalElements: content.length, content })
    return
  }

  const directChunkMatch = path.match(/^\/documents\/([^/]+)\/chunks\/([^/]+)$/)
  if (directChunkMatch && method === 'GET') {
    const chunk = chunksFixture.find((item) => item.id === directChunkMatch[2])
    if (!chunk) {
      await problem(route, 404, 'Not found', 'Chunk was not found.')
      return
    }
    await json(route, { ...chunk, documentId: directChunkMatch[1], kind: 'FLAT' })
    return
  }

  if (chunksMatch && method === 'GET') {
    await json(route, chunksFixture.map((chunk) => ({ ...chunk, documentId: chunksMatch[1] })))
    return
  }

  const migrationPreviewMatch = path.match(/^\/knowledge-bases\/([^/]+)\/chunk-migrations\/preview$/)
  if (migrationPreviewMatch && method === 'POST') {
    const payload = request.postDataJSON() as { selection: string }
    await json(route, { ...state.migrationPreview, knowledgeBaseId: migrationPreviewMatch[1], selection: payload.selection })
    return
  }

  const reprocessingPlanMatch = path.match(/^\/knowledge-bases\/([^/]+)\/reprocessing-plans(?:\/([^/]+))?(?:\/retry)?$/)
  if (reprocessingPlanMatch && method === 'GET') {
    if (reprocessingPlanMatch[2]) {
      await json(route, { ...state.migrationPlan, knowledgeBaseId: reprocessingPlanMatch[1], id: reprocessingPlanMatch[2] })
    } else {
      await json(route, { ...state.migrationHistory, content: state.migrationHistory.totalElements ? [state.migrationPlan] : [] })
    }
    return
  }

  const reprocessingPlansCollectionMatch = path.match(/^\/knowledge-bases\/([^/]+)\/reprocessing-plans$/)
  if (reprocessingPlansCollectionMatch && method === 'POST') {
    state.migrationCreateBodies.push(request.postDataJSON())
    state.migrationHistory = { page: 0, size: 10, totalElements: 1, content: [{ ...state.migrationPlan, latest: true, targetCurrent: true, retryable: true, statusLocation: '/reprocessing-plans/plan-1' }] }
    await json(route, { planId: 'plan-1', status: 'QUEUED', statusLocation: '/reprocessing-plans/plan-1' }, 202)
    return
  }

  const reprocessingRetryMatch = path.match(/^\/knowledge-bases\/([^/]+)\/reprocessing-plans\/([^/]+)\/retry$/)
  if (reprocessingRetryMatch && method === 'POST') {
    state.migrationRetryBodies.push(request.postDataJSON())
    await json(route, { planId: 'retry-plan', status: 'QUEUED', statusLocation: '/reprocessing-plans/retry-plan' }, 202)
    return
  }

  const advancedSearchReadinessMatch = path.match(/^\/knowledge-bases\/([^/]+)\/queries\/advanced-search-runs\/readiness$/)
  if (advancedSearchReadinessMatch && method === 'GET') {
    await json(route, {
      knowledgeBaseId: advancedSearchReadinessMatch[1], ready: true, profileId: 'default', profileRevision: 1,
      graphBranchAvailable: true, embeddedCorpusPresent: true, blockers: [], informational: [],
    })
    return
  }

  const advancedSearchCollectionMatch = path.match(/^\/knowledge-bases\/([^/]+)\/queries\/advanced-search-runs$/)
  if (advancedSearchCollectionMatch && method === 'POST') {
    const payload = request.postDataJSON() as { query: string; maximumEvidence?: number; includeEvidenceText: boolean }
    state.advancedSearchCreateBodies.push(payload)
    const run: AdvancedSearchRunDetail = {
      id: `advanced-run-${state.advancedSearchRuns.length + 1}`,
      knowledgeBaseId: advancedSearchCollectionMatch[1],
      query: payload.query,
      maximumEvidence: payload.maximumEvidence ?? 5,
      includeEvidenceText: payload.includeEvidenceText,
      status: 'RUNNING', stage: 'RETRIEVAL', completedBranches: 0, totalBranches: 1, evidenceCount: 0,
      cancellationRequested: false, failureCategory: null, deadlineAt: '2026-05-06T15:00:00.000Z',
      createdAt: '2026-05-06T14:00:00.000Z', startedAt: '2026-05-06T14:00:01.000Z', completedAt: null, links: {},
    }
    state.advancedSearchRuns.unshift(run)
    await json(route, run, 201)
    return
  }

  if (advancedSearchCollectionMatch && method === 'GET') {
    const status = url.searchParams.get('status')
    const content = state.advancedSearchRuns
      .filter((run) => !status || run.status === status)
      .map(({ query, ...run }) => ({ ...run, queryPreview: query }))
    await json(route, { page: Number(url.searchParams.get('page') ?? '0'), size: Number(url.searchParams.get('size') ?? '10'), totalElements: content.length, content })
    return
  }

  const advancedSearchRunMatch = path.match(/^\/knowledge-bases\/([^/]+)\/queries\/advanced-search-runs\/([^/]+)(?:\/(cancel|result))?$/)
  if (advancedSearchRunMatch) {
    const run = state.advancedSearchRuns.find((item) => item.id === advancedSearchRunMatch[2])
    if (!run || run.knowledgeBaseId !== advancedSearchRunMatch[1]) {
      await problem(route, 404, 'Not found', 'Advanced-search run was not found.')
      return
    }
    if (advancedSearchRunMatch[3] === 'cancel' && method === 'POST') {
      run.status = 'CANCELLED'
      run.stage = 'TERMINAL'
      run.cancellationRequested = true
      run.completedAt = '2026-05-06T14:00:02.000Z'
      await json(route, run)
      return
    }
    if (!advancedSearchRunMatch[3] && method === 'GET') {
      await json(route, run)
      return
    }
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
