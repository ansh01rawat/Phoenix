import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('shell navigation, persisted collapse, project search, and history filters', async ({
  page,
}) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click()
  await page.getByLabel('Search projects').fill('no-such-project')
  await expect(page.getByText('No projects match that search.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(page.locator('.project-card')).toHaveCount(3)
  await page.locator('.project-card').first().click()
  await expect(
    page.getByRole('heading', { name: 'Forma storefront', level: 1, exact: true }),
  ).toBeVisible()
  await page.goto('/app/repairs')
  await page.getByRole('button', { name: /Approved/ }).click()
  await expect(page.locator('.repair-row')).toHaveCount(1)
})
test('command menu, accessible guide, dropdowns, and mobile drawer focus', async ({ page }) => {
  await page.goto('/app')
  await page.keyboard.press('Control+k')
  const search = page.getByRole('combobox', { name: 'Search pages' })
  await expect(search).toBeFocused()
  await search.fill('settings')
  await search.press('Enter')
  await expect(page).toHaveURL('/app/settings')
  await page.getByRole('button', { name: 'Open Phoenix guide', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText(
    'No selected source files are uploaded, executed, or changed.',
  )
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Open Phoenix guide', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Choose workspace', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Workspace settings', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true })
  await menu.click()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await menu.click()
  await page
    .getByRole('dialog', { name: 'Workspace navigation' })
    .getByRole('link', { name: 'Projects', exact: true })
    .click()
  await expect(page).toHaveURL('/app/projects')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
test('persisted motion preferences, interrupted work recovery, and missing-session recovery', async ({
  page,
}) => {
  await page.goto('/app/settings')
  await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Reduce motion', exact: true })).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true')
  await page.goto('/app/repairs/demo/diagnosis')
  await page.getByRole('button', { name: 'Run demo diagnosis', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Run demo diagnosis', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('interrupted')
  await page.goto('/app/repairs/missing/diagnosis')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeAttached()
  await page.getByRole('link', { name: 'Back to overview', exact: true }).click()
  await expect(page).toHaveURL('/app')
})
test('mobile readable diff and final shell accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/app/repairs/px-1041/changes')
  await expect(page.getByRole('region', { name: /Unified code comparison/ })).toBeVisible()
  await expect(page.locator('.monaco-diff-editor')).toHaveCount(0)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.goto('/app/settings')
  // Audit the settled page, rather than a partially transparent entrance frame.
  await expect(page.locator('.settings-page')).toHaveCSS('opacity', '1')
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
  ).toEqual([])
})
