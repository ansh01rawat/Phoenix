import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'
import { sampleProjects, sampleSessions } from '../../src/services/mock/fixtures'

test('preview loading, selected version, stale requests, unavailable state, and retry', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/app/repairs/px-1041/preview')
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page.clock.install({ time: new Date('2026-11-01T08:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-01T08:00:01Z'))
  await page.getByRole('button', { name: 'Refresh preview', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Loading sample preview' })).toBeVisible()
  await mkdir('docs/screenshots/phase45', { recursive: true })
  await page.screenshot({ path: 'docs/screenshots/phase45/preview-loading.png', fullPage: true })
  await page.clock.runFor(500)
  await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page.getByRole('button', { name: 'Repaired', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page.getByRole('button', { name: 'Original', exact: true }).click()
  await page.getByRole('button', { name: 'Repaired', exact: true }).click()
  await page.clock.runFor(500)
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  await expect(page.locator('iframe')).toHaveAttribute('title', 'Repaired sample website')
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', '')
  await page.getByRole('button', { name: 'Preview demo scenarios', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Unavailable sample', exact: true }).click()
  await page.clock.runFor(500)
  await expect(page.getByRole('alert')).toContainText('simulates an unavailable preview')
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.screenshot({ path: 'docs/screenshots/phase45/preview-error.png', fullPage: true })
  await page.getByRole('button', { name: 'Retry sample preview', exact: true }).click()
  await page.clock.runFor(500)
  await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  expect(errors).toEqual([])
})

test('full sample import to explicitly confirmed approval, with exact-file diff navigation', async ({
  page,
}) => {
  await page.goto('/app/repairs/new')
  await page.getByRole('button', { name: 'Use sample project', exact: true }).click()
  await page.getByRole('button', { name: 'Run demo diagnosis', exact: true }).click()
  await page.getByRole('link', { name: 'Inspect proposed changes', exact: true }).click()
  await page.getByRole('link', { name: 'Preview repair', exact: true }).click()
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  await page.getByRole('link', { name: 'Review checks', exact: true }).click()
  await page.getByRole('button', { name: 'Run demo checks', exact: true }).click()
  await expect(page.getByText('Demonstration checks completed.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Passed', exact: true }).click()
  await expect(page.locator('.test-result')).toHaveCount(5)
  await page.getByRole('button', { name: 'Skipped', exact: true }).click()
  await expect(page.locator('.test-result')).toHaveCount(1)
  await page.locator('.test-result summary').click()
  await expect(page.locator('.test-result pre')).toContainText('No payment backend is connected')
  await page.getByRole('link', { name: 'Review repair', exact: true }).click()
  const home = page.locator('.review-file').filter({ hasText: 'src/pages/Home.tsx' })
  await home.locator('summary').click()
  await expect(home.locator('.review-file-explanation')).toContainText(
    'homepage now communicates loading',
  )
  await page.getByRole('link', { name: 'Inspect Home.tsx diff', exact: true }).click()
  await expect(page.locator('.diff-file-header')).toContainText('src/pages/Home.tsx')
  await page
    .getByRole('navigation', { name: 'Repair workflow' })
    .getByRole('link', { name: /Review/ })
    .click()
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Keep reviewing', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm demo approval', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your demo approval is recorded.', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Approval recorded · application not performed · no deployment'),
  ).toBeVisible()
})

test('a frame that never reports ready times out and can be retried', async ({ page }) => {
  await page.goto('/app/repairs/px-1041/preview')
  await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await page.clock.install({ time: new Date('2026-11-01T08:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-01T08:00:01Z'))
  await page.evaluate(() => {
    const scope = window as typeof window & { testFrameLoadBlocker?: (event: Event) => void }
    scope.testFrameLoadBlocker = (event) => {
      if (event.target instanceof HTMLIFrameElement) event.stopImmediatePropagation()
    }
    window.addEventListener('load', scope.testFrameLoadBlocker, true)
  })
  await page.getByRole('button', { name: 'Refresh preview', exact: true }).click()
  await page.clock.runFor(7000)
  await expect(page.getByRole('alert')).toContainText('did not finish loading')
  await page.evaluate(() => {
    const scope = window as typeof window & { testFrameLoadBlocker?: (event: Event) => void }
    if (scope.testFrameLoadBlocker)
      window.removeEventListener('load', scope.testFrameLoadBlocker, true)
    delete scope.testFrameLoadBlocker
  })
  await page.getByRole('button', { name: 'Retry sample preview', exact: true }).click()
  await page.clock.runFor(500)
  await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
})

for (const scenario of ['missing', 'skipped', 'duplicate'] as const) {
  test(`approval requires a complete report: ${scenario} required check`, async ({ page }) => {
    const sessions = structuredClone(sampleSessions)
    const session = sessions.find((item) => item.id === 'px-1041')!
    if (scenario === 'missing')
      session.tests = session.tests.filter((item) => item.id !== 'runtime')
    if (scenario === 'skipped')
      session.tests = session.tests.map((item) =>
        item.id === 'runtime' ? { ...item, status: 'skipped' } : item,
      )
    if (scenario === 'duplicate') session.tests.push(structuredClone(session.tests[0]))
    await page.addInitScript(
      (state) => localStorage.setItem('phoenix-demo-v2', JSON.stringify({ state, version: 2 })),
      { projects: sampleProjects, sessions },
    )
    await page.goto('/app/repairs/px-1041/review')
    await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeDisabled()
    await expect(
      page.getByRole('heading', { name: 'Verification needs attention.', exact: true }),
    ).toBeVisible()
  })
}

test('pending decisions serialize verification and do not apply source', async ({ page }) => {
  await page.goto('/app/repairs/px-1041/tests')
  await page.getByRole('link', { name: 'Review repair', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeEnabled()
  await page.clock.install({ time: new Date('2026-11-01T08:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-01T08:00:01Z'))
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
  await page.getByRole('button', { name: 'Confirm demo approval', exact: true }).click()
  await expect(page.getByText('Recording demo decision', { exact: true })).toBeVisible()
  await page.goBack()
  await page.clock.runFor(1)
  await expect(
    page.getByRole('button', { name: 'Run demo checks again', exact: true }),
  ).toBeDisabled()
  await page.clock.runFor(500)
  await expect(page.locator('.recorded-report-note')).toContainText(
    'approval recorded, no files applied',
  )
  const result = await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem('phoenix-demo-v2')!).state.sessions.find(
      (item: { id: string }) => item.id === 'px-1041',
    )
    return {
      decision: session.decision,
      application: session.application,
      verification: session.verification,
    }
  })
  expect(result).toEqual({
    decision: 'approved',
    application: 'not_applied',
    verification: 'simulated',
  })
})

test('an interrupted approval requires a fresh explicit confirmation', async ({ page }) => {
  const sessions = structuredClone(sampleSessions)
  sessions.find((item) => item.id === 'px-1041')!.status = 'APPROVAL_PENDING'
  await page.addInitScript(
    (state) => localStorage.setItem('phoenix-demo-v2', JSON.stringify({ state, version: 2 })),
    { projects: sampleProjects, sessions },
  )
  await page.goto('/app/repairs/px-1041/review')
  await expect(page.getByRole('status')).toContainText('approval was interrupted')
  await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeEnabled()
  await expect(
    page.getByRole('heading', { name: 'Your demo approval is recorded.', exact: true }),
  ).toHaveCount(0)
})

test('the active workflow stage stays visible after resizing without moving the page', async ({
  page,
}) => {
  await page.goto('/app/repairs/px-1041/review')
  await expect(
    page.getByRole('heading', { name: 'Your repair is ready for review.' }),
  ).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page.getByRole('navigation', { name: 'Repair workflow' }).evaluate((navigation) => {
        const current = navigation.querySelector('[aria-current="page"]')!
        const strip = navigation.getBoundingClientRect()
        const tab = current.getBoundingClientRect()
        return tab.left >= strip.left && tab.right <= strip.right
      }),
    )
    .toBe(true)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('preview errors and expanded explanations remain accessible on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/app/repairs/px-1041/preview')
  await page.getByRole('button', { name: 'Preview demo scenarios', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Unavailable sample', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390)
  await page.screenshot({
    path: 'docs/screenshots/phase45/preview-error-mobile.png',
    fullPage: true,
  })
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations.map((item) => item.id)).toEqual([])
  await page.goto('/app/repairs/px-1041/review')
  await page.locator('.review-file-explanation summary').first().click()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({
    path: 'docs/screenshots/phase45/review-explanations-mobile.png',
    fullPage: true,
  })
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(
    result.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
})
