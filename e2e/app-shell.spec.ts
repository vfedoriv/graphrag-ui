import { expect, test } from '@playwright/test'
import { mockGraphRagApi } from './support/apiMock'

test('navigates across controller pages and preserves knowledge-base context', async ({ page }) => {
  const api = await mockGraphRagApi(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Knowledge bases and schemas' })).toBeVisible()
  await expect(page.getByText('Workspace: None selected')).toBeVisible()

  await page.getByLabel('knowledge-base-selector').selectOption('kb-alpha')
  await expect(page.getByLabel('knowledge-base-selector')).toHaveValue('kb-alpha')
  await expect(page.getByText('Workspace: Alpha Research')).toBeVisible()

  await page.getByRole('link', { name: 'Knowledge Bases', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Knowledge Bases', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'kb-alpha' })).toBeVisible()

  await page.getByRole('link', { name: 'Schemas', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Schemas', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Customer graph' })).toBeVisible()

  await page.getByRole('link', { name: 'Documents', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Documents', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'alpha-notes.txt' })).toBeVisible()

  await page.getByRole('link', { name: 'Queries', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Queries', exact: true })).toBeVisible()
  await expect(page.getByText('Use tabs below to run endpoint workflows')).toBeVisible()

  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
  await expect(page.getByText('Backend settings catalog')).toBeVisible()
  await expect(page.getByText('API base: /api/v1')).toBeVisible()

  expect(api.selectedKnowledgeBaseRequests('kb-alpha').length).toBeGreaterThan(0)
  expect(api.unhandled).toEqual([])
})
