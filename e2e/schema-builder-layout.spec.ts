import { expect, test } from '@playwright/test'
import { mockGraphRagApi } from './support/apiMock'

async function openDenseSchemaBuilder(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByLabel('knowledge-base-selector').selectOption('kb-alpha')
  await page.goto('/schema-builder?schemaId=schema-customer')
  await page.getByRole('button', { name: 'Select relationship OWNS_ACCOUNT' }).click()
}

test('bounds a long desktop inspector and restores normal narrow-screen flow', async ({ page }) => {
  const api = await mockGraphRagApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDenseSchemaBuilder(page)

  const inspector = page.getByTestId('schema-builder-sidebar')
  const visualBuilder = page.getByTestId('schema-builder-page-top-section')
  const rawJsonHeading = page.getByRole('heading', { name: 'Raw JSON contract' })
  await expect(inspector.getByRole('group', { name: 'Relationship properties' })).toBeVisible()
  await expect(inspector.getByLabel('Relationship properties name')).toHaveCount(8)

  const desktopOverflow = await inspector.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      clientHeight: element.clientHeight,
      overflowY: style.overflowY,
      scrollHeight: element.scrollHeight,
    }
  })
  expect(desktopOverflow.overflowY).toBe('auto')
  expect(desktopOverflow.scrollHeight).toBeGreaterThan(desktopOverflow.clientHeight)

  const visualBuilderBox = await visualBuilder.boundingBox()
  const rawJsonHeadingBox = await rawJsonHeading.boundingBox()
  expect(visualBuilderBox).not.toBeNull()
  expect(rawJsonHeadingBox).not.toBeNull()
  expect(rawJsonHeadingBox!.y - (visualBuilderBox!.y + visualBuilderBox!.height)).toBeLessThan(80)

  await page.setViewportSize({ width: 500, height: 900 })
  const narrowLayout = await inspector.evaluate((element) => {
    const style = getComputedStyle(element)
    const propertyRows = [...element.querySelectorAll<HTMLElement>('.schema-property-row')]
    return {
      maxBlockSize: style.maxBlockSize,
      overflowY: style.overflowY,
      sidebarFits: element.scrollWidth <= element.clientWidth,
      rowsFit: propertyRows.every((row) => row.scrollWidth <= row.clientWidth),
    }
  })
  expect(narrowLayout.maxBlockSize).toBe('none')
  expect(narrowLayout.overflowY).toBe('visible')
  expect(narrowLayout.sidebarFits).toBe(true)
  expect(narrowLayout.rowsFit).toBe(true)
  expect(api.unhandled).toEqual([])
})

test('keeps React Flow canvas controls visible and focusable in light and dark themes', async ({ page }) => {
  const api = await mockGraphRagApi(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDenseSchemaBuilder(page)

  const controlNames = [/Zoom In/i, /Zoom Out/i, /Fit View/i, /Toggle Interactivity/i]
  for (const theme of ['light', 'dark'] as const) {
    await page.getByRole('combobox', { name: 'Appearance' }).selectOption(theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    for (const name of controlNames) {
      const control = page.getByRole('button', { name })
      await expect(control).toBeVisible()
      const colors = await control.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          backgroundColor: style.backgroundColor,
          borderBottomColor: style.borderBottomColor,
          color: style.color,
        }
      })
      expect(colors.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(colors.color).not.toBe(colors.backgroundColor)
      expect(colors.borderBottomColor).not.toBe('rgba(0, 0, 0, 0)')
    }

    const fitView = page.getByRole('button', { name: /Fit View/i })
    const restingBackground = await fitView.evaluate((element) => getComputedStyle(element).backgroundColor)
    await fitView.hover()
    await expect.poll(() => fitView.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(restingBackground)
    await page.getByRole('button', { name: /Zoom Out/i }).focus()
    await page.keyboard.press('Tab')
    await expect(fitView).toBeFocused()
    await expect.poll(() => fitView.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  }

  expect(api.unhandled).toEqual([])
})
