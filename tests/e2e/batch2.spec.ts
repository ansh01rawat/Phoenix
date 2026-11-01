import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
test('batch 2: safe preview, failed verification guard, recovery, and explicit approval', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/app/repairs/px-1041/preview')
  await expect(page.locator('.preview-toolbar')).toHaveCSS('display', 'flex')
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', '')
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  await page.getByRole('button', { name: 'Original', exact: true }).click()
  await expect(
    page.frameLocator('iframe').getByText('This collection could not render.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Repaired', exact: true }).click()
  await page.getByRole('button', { name: 'Mobile', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCSS('width', '390px')
  await page.getByRole('button', { name: 'Refresh preview', exact: true }).click()
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  await page.getByRole('link', { name: 'Review checks', exact: true }).click()
  await page.getByLabel('Demo verification scenario').selectOption('failed')
  await page.getByRole('button', { name: 'Run demo checks again', exact: true }).click()
  await expect(page.getByText('A sample check needs attention.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Failed', exact: true }).click()
  await page
    .locator('.test-result')
    .filter({ hasText: 'Undefined product data' })
    .locator('summary')
    .click()
  await expect(page.getByText('DEMO FAILURE SCENARIO', { exact: false })).toBeVisible()
  await page.getByRole('link', { name: 'Review repair', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeDisabled()
  await page.getByRole('link', { name: 'View report', exact: true }).click()
  await page.getByLabel('Demo verification scenario').selectOption('passed')
  await page.getByRole('button', { name: 'Run demo checks again', exact: true }).click()
  await expect(page.getByText('Demonstration checks completed.', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Review repair', exact: true }).click()
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText(
    'no original files will be applied or deployed',
  )
  await page.getByRole('button', { name: 'Keep reviewing', exact: true }).click()
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm demo approval', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your demo approval is recorded.', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Your demo approval is recorded.', exact: true }),
  ).toBeVisible()
  const session = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('phoenix-demo-v2')!).state.sessions.find(
      (item: { id: string }) => item.id === 'px-1041',
    ),
  )
  expect(session.application).toBe('not_applied')
  expect(errors).toEqual([])
})
test('batch 2: rejection discards the simulated copy and preserves history', async ({ page }) => {
  await page.goto('/app/repairs/px-1041/review')
  await page.getByRole('button', { name: 'Reject repair', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm demo rejection', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'This demo repair was rejected.', exact: true }),
  ).toBeVisible()
  await page.goto('/app/repairs/px-1041/changes')
  await expect(
    page.getByRole('heading', { name: 'This demo proposal was discarded.', exact: true }),
  ).toBeVisible()
  await page.goto('/app/repairs')
  await page.getByRole('button', { name: /Rejected/ }).click()
  await expect(page.locator('.repair-row')).toHaveCount(1)
})
test('batch 2: responsive preview, tests, review, and accessible decisions', async ({ page }) => {
  await mkdir('docs/screenshots', { recursive: true })
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    for (const stage of ['preview', 'tests', 'review']) {
      await page.goto(`/app/repairs/px-1041/${stage}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (stage === 'preview')
        await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width)
      await page.screenshot({
        path: `docs/screenshots/batch2-${stage}-${width}.png`,
        fullPage: true,
        animations: 'disabled',
      })
      if (width === 1440 || width === 390) {
        const result = await new AxeBuilder({ page })
          .setLegacyMode()
          .options({ iframes: false })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
        expect(
          result.violations.map((item) => ({
            id: item.id,
            targets: item.nodes.map((node) => node.target),
          })),
        ).toEqual([])
      }
    }
  }
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
  const result = await new AxeBuilder({ page })
    .setLegacyMode()
    .options({ iframes: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(result.violations.map((item) => item.id)).toEqual([])
})
