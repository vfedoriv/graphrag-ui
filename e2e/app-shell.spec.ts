import { expect, test } from '@playwright/test'
import { mockGraphRagApi } from './support/apiMock'

test('navigates across controller pages and preserves knowledge-base context', async ({ page }) => {
  const api = await mockGraphRagApi(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('No Active Knowledge Base')).toBeVisible()

  await page.getByLabel('knowledge-base-selector').selectOption('kb-alpha')
  await expect(page.locator('header p.font-semibold', { hasText: 'Alpha Research (kb-alpha)' })).toBeVisible()
  await expect(page.getByText('Knowledge base id: kb-alpha')).toBeVisible()

  await page.getByRole('link', { name: 'Knowledge Bases' }).click()
  await expect(page.getByRole('heading', { name: 'Knowledge Bases', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'kb-alpha' })).toBeVisible()

  await page.getByRole('link', { name: 'Schemas' }).click()
  await expect(page.getByRole('heading', { name: 'Schemas', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'schema-customer' })).toBeVisible()

  await page.getByRole('link', { name: 'Documents' }).click()
  await expect(page.getByRole('heading', { name: 'Documents', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'alpha-notes.txt' })).toBeVisible()

  await page.getByRole('link', { name: 'Queries' }).click()
  await expect(page.getByRole('heading', { name: 'Queries', exact: true })).toBeVisible()
  await expect(page.getByText('Use tabs below to run endpoint workflows')).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
  await expect(page.getByText('Frontend calls /api/v1')).toBeVisible()

  expect(api.selectedKnowledgeBaseRequests('kb-alpha').length).toBeGreaterThan(0)
  expect(api.unhandled).toEqual([])
})
