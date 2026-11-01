import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
test('batch 1: import, diagnosis, local Monaco diff, and navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Recent projects' })).toBeVisible()
  await page.goto('/app/repairs/new')
  await page.getByLabel('Choose ZIP archive').setInputFiles({
    name: 'invalid.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('not a zip'),
  })
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Choose ZIP archive').setInputFiles('public/demo/forma-storefront.zip')
  await expect(page.getByRole('button', { name: 'Start demo repair' })).toBeEnabled()
  await page.getByRole('button', { name: 'Start demo repair' }).click()
  await page.getByRole('button', { name: 'Run demo diagnosis' }).click()
  await expect(page.getByRole('link', { name: 'Inspect proposed changes' })).toBeVisible()
  await page.getByRole('button', { name: /Missing loading and error boundaries/ }).click()
  await expect(page.locator('.issue-details')).toContainText('request lifecycle')
  await page.getByRole('link', { name: 'Inspect proposed changes' }).click()
  await expect(page.locator('.monaco-diff-editor')).toBeVisible({ timeout: 20000 })
  await page
    .getByRole('navigation', { name: 'Changed files' })
    .getByRole('button', { name: /Home.tsx/ })
    .click()
  await expect(page.locator('.change-explanation')).toContainText('loading and request failures')
  await expect(
    page.getByRole('textbox', { name: 'Proposed demo repair for src/pages/Home.tsx', exact: true }),
  ).toBeAttached()
  await mkdir('docs/screenshots', { recursive: true })
  await page.screenshot({ path: 'docs/screenshots/batch1-diff.png', fullPage: true })
  expect(errors).toEqual([])
})
test('batch 1: responsive dashboard, import, and sample diagnosis', async ({ page }) => {
  await mkdir('docs/screenshots', { recursive: true })
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    for (const [name, path] of [
      ['dashboard', '/app'],
      ['import', '/app/repairs/new'],
      ['diagnosis', '/app/repairs/px-1041/diagnosis'],
    ]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (path === '/app')
        await expect(page.locator('.dashboard-stats')).toHaveCSS('display', 'grid')
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width)
      await page.screenshot({
        path: `docs/screenshots/batch1-${name}-${width}.png`,
        fullPage: true,
        animations: 'disabled',
      })
    }
  }
})
test('batch 1: accessible product surfaces', async ({ page }) => {
  for (const path of [
    '/app',
    '/app/projects',
    '/app/repairs/new',
    '/app/repairs/px-1041/diagnosis',
  ]) {
    await page.goto(path)
    await page.getByRole('heading', { level: 1 }).waitFor()
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    ).toEqual([])
  }
})
