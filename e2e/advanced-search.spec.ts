import { expect, test } from '@playwright/test'
import { mockGraphRagApi } from './support/apiMock'

test('submits, focuses, reloads, and cancels an advanced-search run', async ({ page }) => {
  const api = await mockGraphRagApi(page)

  await page.goto('/advanced-search')
  await page.getByLabel('knowledge-base-selector').selectOption('kb-alpha')
  await expect(page.getByText('Ready for advanced search')).toBeVisible()

  await page.getByLabel('Question').fill('Which customers are active?')
  await page.getByRole('button', { name: 'Submit search' }).click()
  await expect(page).toHaveURL(/\/advanced-search\?runId=advanced-run-1$/)
  await expect(page.getByRole('heading', { name: 'advanced-run-1' })).toBeVisible()
  await expect(page.getByText('Which customers are active?', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('span.status').filter({ hasText: 'CANCELLED' })).toBeVisible()
  await expect(page.getByText('Cancellation state updated')).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/\/advanced-search\?runId=advanced-run-1$/)
  await expect(page.getByRole('heading', { name: 'advanced-run-1' })).toBeVisible()
  await expect(page.getByText('Run cancelled')).toBeVisible()

  expect(api.advancedSearchCreateBodies).toEqual([{ query: 'Which customers are active?', includeEvidenceText: true }])
  expect(api.unhandled).toEqual([])
})
