import { expect, test } from '@playwright/test'
import { mockGraphRagApi } from './support/apiMock'

async function selectKnowledgeBase(page: import('@playwright/test').Page, knowledgeBaseId = 'kb-alpha') {
  await page.goto('/')
  await page.getByLabel('knowledge-base-selector').selectOption(knowledgeBaseId)
  await expect(page.locator('header p.font-semibold', { hasText: knowledgeBaseId })).toBeVisible()
}

test('creates, selects, and surfaces create errors for knowledge bases', async ({ page }) => {
  const api = await mockGraphRagApi(page)

  await page.goto('/knowledge-bases')
  await page.getByLabel('Knowledge base ID').fill('kb-e2e')
  await page.getByLabel('Knowledge base name').fill('Browser E2E')
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page.locator('header p.font-semibold', { hasText: 'Browser E2E (kb-e2e)' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'kb-e2e' })).toBeVisible()

  await page.getByLabel('Knowledge base ID').fill('kb-error')
  await page.getByLabel('Knowledge base name').fill('Reserved')
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page.getByText('Create failed')).toBeVisible()
  await expect(page.getByText('Knowledge base ID is reserved for error coverage.')).toBeVisible()
  expect(api.unhandled).toEqual([])
})

test('validates, creates, and activates schemas for the selected knowledge base', async ({ page }) => {
  const api = await mockGraphRagApi(page)
  await selectKnowledgeBase(page)

  await page.goto('/schemas')
  await expect(page.getByRole('cell', { name: 'schema-customer' })).toBeVisible()
  await page.getByRole('button', { name: 'Activate' }).click()
  await expect.poll(() => api.requests.some((request) => request === 'POST /knowledge-bases/kb-alpha/schemas/schema-customer/activate')).toBe(true)

  await page.getByTestId('schemas-endpoint-tabs-tab-validate-schema-json').click()
  const validatePanel = page.getByTestId('schemas-endpoint-tabs-panel-validate-schema-json')
  await validatePanel.getByRole('button', { name: 'Raw View' }).click()
  await validatePanel.getByRole('textbox', { name: 'Schema JSON content' }).fill('{"nodes":[],"relationships":[]}')
  await validatePanel.getByRole('button', { name: 'Validate schema JSON' }).click()
  await expect(validatePanel.getByText('Schema is valid.')).toBeVisible()

  await page.getByTestId('schemas-endpoint-tabs-tab-create-schema').click()
  const createPanel = page.getByTestId('schemas-endpoint-tabs-panel-create-schema')
  await createPanel.getByRole('button', { name: 'Raw View' }).click()
  await createPanel.getByRole('textbox', { name: 'Schema JSON content' }).fill('{"nodes":[{"label":"Person"}],"relationships":[]}')
  await createPanel.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('cell', { name: 'schema-created' })).toBeVisible()
  expect(api.unhandled).toEqual([])
})

test('uploads, processes, and inspects document chunks', async ({ page }) => {
  const api = await mockGraphRagApi(page)
  await selectKnowledgeBase(page)

  await page.goto('/documents')
  await expect(page.getByRole('cell', { name: 'alpha-notes.txt' })).toBeVisible()

  await page.getByTestId('documents-upload-select-file-input').setInputFiles({
    name: 'browser-upload.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Browser uploaded document body'),
  })
  await expect(page.getByText('Selected file: browser-upload.txt')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'browser-upload.txt' })).toBeVisible()

  const uploadedRow = page.getByRole('row', { name: /browser-upload\.txt/ })
  await uploadedRow.getByRole('button', { name: 'Process' }).click()
  await expect(uploadedRow.getByRole('cell', { name: 'PROCESSED' })).toBeVisible()

  await uploadedRow.getByRole('button', { name: 'View chunks' }).click()
  await expect(page.getByText('Selected document: doc-uploaded')).toBeVisible()
  await expect(page.getByTestId('output-preview-content')).toContainText('Alpha customer chunk text')
  expect(api.unhandled).toEqual([])
})

test('runs query ask, generate, validate, and execute workflows', async ({ page }) => {
  const api = await mockGraphRagApi(page)
  await selectKnowledgeBase(page)

  await page.goto('/queries')
  const askPanel = page.getByTestId('queries-endpoint-tabs-panel-ask-query')
  await askPanel.getByLabel('Question prompt').fill('Who are the customers?')
  await askPanel.getByRole('button', { name: 'Ask' }).click()
  await expect(askPanel.getByTestId('output-preview-content')).toContainText('Ada Lovelace')

  await page.getByTestId('queries-endpoint-tabs-tab-generate-cypher').click()
  const generatePanel = page.getByTestId('queries-endpoint-tabs-panel-generate-cypher')
  await generatePanel.getByLabel('Question prompt').fill('List names')
  await generatePanel.getByRole('button', { name: 'Generate Cypher' }).click()
  await expect(generatePanel.getByLabel('Generated Cypher query')).toHaveValue(/MATCH \(n\)/)

  await page.getByTestId('queries-endpoint-tabs-tab-validate-cypher').click()
  const validatePanel = page.getByTestId('queries-endpoint-tabs-panel-validate-cypher')
  await validatePanel.getByRole('button', { name: 'Validate' }).click()
  await expect(validatePanel.getByTestId('output-preview-content')).toContainText('"valid": true')

  await page.getByTestId('queries-endpoint-tabs-tab-execute-cypher').click()
  const executePanel = page.getByTestId('queries-endpoint-tabs-panel-execute-cypher')
  await executePanel.getByRole('button', { name: 'Execute' }).click()
  await expect(executePanel.getByRole('cell', { name: 'Ada Lovelace' })).toBeVisible()

  expect(api.selectedKnowledgeBaseRequests('kb-alpha')).toEqual(expect.arrayContaining([
    'POST /knowledge-bases/kb-alpha/queries/ask',
    'POST /knowledge-bases/kb-alpha/queries/generate',
    'POST /knowledge-bases/kb-alpha/queries/validate',
    'POST /knowledge-bases/kb-alpha/queries/execute',
  ]))
  expect(api.unhandled).toEqual([])
})
