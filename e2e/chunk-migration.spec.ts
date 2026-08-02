import { expect, test } from '@playwright/test'
import { mockGraphRagApi } from './support/apiMock'

test('runs the deterministic preview, migration, audit, and closed retry flow', async ({ page }) => {
  const api = await mockGraphRagApi(page)

  await page.goto('/')
  await page.getByLabel('knowledge-base-selector').selectOption('kb-alpha')
  await page.goto('/chunking?view=reprocessing')

  await expect(page.getByRole('heading', { name: 'Reprocessing' })).toBeVisible()
  await expect(page.getByText('Migration preview ready')).toBeVisible()
  await expect(page.getByText('chunker-v2')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Create migration plan' })).toBeEnabled()

  await page.getByRole('button', { name: 'Create migration plan' }).click()
  await expect.poll(() => api.migrationCreateBodies).toEqual([{
    reason: 'CHUNK_STRATEGY_MIGRATION',
    selection: 'OUTDATED_STRATEGY',
    processingOptions: null,
    expectedChunkerRevision: 'chunker-v2',
  }])
  await expect(page).toHaveURL(/\/chunking\?view=reprocessing&planId=plan-1/)
  await expect(page.getByText(/Stale source · doc-alpha/)).toBeVisible()

  await page.getByRole('button', { name: 'Retry unresolved work' }).click()
  const dialog = page.getByRole('dialog', { name: 'Retry unresolved migration work' })
  await expect(dialog).toContainText('Prior successful items remain')
  await dialog.getByRole('button', { name: 'Confirm retry' }).click()
  await expect.poll(() => api.migrationRetryBodies).toEqual([{ mode: 'RESNAPSHOT_UNRESOLVED' }])
  await expect(page).toHaveURL(/\/chunking\?view=reprocessing&planId=retry-plan/)

  expect(api.requests).toEqual(expect.arrayContaining([
    'POST /knowledge-bases/kb-alpha/chunk-migrations/preview?page=0&size=10',
    'POST /knowledge-bases/kb-alpha/reprocessing-plans',
    'GET /knowledge-bases/kb-alpha/reprocessing-plans?reason=CHUNK_STRATEGY_MIGRATION&page=0&size=10',
    'GET /knowledge-bases/kb-alpha/reprocessing-plans/plan-1?page=0&size=10',
    'POST /knowledge-bases/kb-alpha/reprocessing-plans/plan-1/retry',
  ]))
  expect(api.unhandled).toEqual([])
})
