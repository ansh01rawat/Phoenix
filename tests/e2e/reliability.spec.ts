import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'
import { sampleProjects, sampleSessions } from '../../src/services/mock/fixtures'

for (const failure of ['write denied', 'storage access denied'] as const) {
  test(`P1: the complete demo works when browser ${failure}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript((mode) => {
      if (mode === 'write denied')
        Storage.prototype.setItem = () => {
          throw new DOMException('Storage unavailable', 'QuotaExceededError')
        }
      else
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Storage unavailable', 'SecurityError')
          },
        })
    }, failure)
    await page.goto('/app/repairs/new')
    await page.getByRole('button', { name: 'Use sample project', exact: true }).click()
    await expect(page).toHaveURL(/\/diagnosis$/)
    await expect(page.getByRole('status').filter({ hasText: 'Session-only mode.' })).toContainText(
      'new changes will be lost on refresh',
    )
    await page.getByRole('button', { name: 'Run demo diagnosis', exact: true }).click()
    await page.getByRole('link', { name: 'Inspect proposed changes', exact: true }).click()
    await expect(page.locator('.monaco-diff-editor')).toBeVisible()
    await page.getByRole('link', { name: 'Preview repair', exact: true }).click()
    await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
    await page.getByRole('link', { name: 'Review checks', exact: true }).click()
    await page.getByRole('button', { name: 'Run demo checks', exact: true }).click()
    await expect(page.getByText('Demonstration checks completed.', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Review repair', exact: true }).click()
    await page.getByRole('button', { name: 'Approve changes', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm demo approval', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Your demo approval is recorded.' }),
    ).toBeVisible()
    await expect(
      page.getByText('Approval recorded · application not performed · no deployment'),
    ).toBeVisible()
    await page.goto('/app/settings')
    await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click()
    await expect(page.getByRole('switch', { name: 'Reduce motion', exact: true })).toBeChecked()
    expect(errors).toEqual([])
  })
}

test('P1: damaged project records do not crash or discard valid projects', async ({ page }) => {
  await page.addInitScript(
    ({ projects, sessions }) => {
      localStorage.setItem(
        'phoenix-demo-v2',
        JSON.stringify({
          version: 2,
          state: { projects: [null, ...projects, { id: 'invalid', name: 42 }], sessions },
        }),
      )
    },
    { projects: sampleProjects, sessions: sampleSessions },
  )
  await page.goto('/app/projects')
  await expect(
    page.getByRole('status').filter({ hasText: 'Saved demo data recovered.' }),
  ).toBeVisible()
  await expect(page.locator('.project-card')).toHaveCount(3)
  await page.getByRole('link', { name: /Northstar docs/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Northstar docs' })).toBeVisible()
  await page.getByRole('button', { name: 'New demo repair', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Run demo diagnosis', exact: true })).toBeVisible()
})

for (const report of ['null', 'invalid nested entry'] as const) {
  test(`P1: a saved ${report} report recovers and requires new checks`, async ({ page }) => {
    await page.addInitScript(
      ({ projects, sessions, mode }) => {
        const target = sessions.find((session) => session.id === 'px-1041')!
        const state = {
          projects,
          sessions: sessions.map((session) =>
            session.id === target.id
              ? { ...session, tests: mode === 'null' ? null : [null, ...session.tests] }
              : session,
          ),
        }
        localStorage.setItem('phoenix-demo-v2', JSON.stringify({ state, version: 2 }))
      },
      { projects: sampleProjects, sessions: sampleSessions, mode: report },
    )
    await page.goto('/app/repairs/px-1041/review')
    await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeDisabled()
    await expect(
      page.getByRole('status').filter({ hasText: 'saved demo report was incomplete' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Run checks', exact: true }).click()
    await page.getByRole('button', { name: 'Run demo checks', exact: true }).click()
    await expect(page.getByText('Demonstration checks completed.', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Review repair', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeEnabled()
  })
}

test('P1: damaged pre-diagnosis data never manufactures a completed proposal', async ({ page }) => {
  await page.addInitScript(
    ({ projects, sessions }) => {
      const state = {
        projects,
        sessions: sessions.map((session) =>
          session.id === 'demo' ? { ...session, tests: null } : session,
        ),
      }
      localStorage.setItem('phoenix-demo-v2', JSON.stringify({ state, version: 2 }))
    },
    { projects: sampleProjects, sessions: sampleSessions },
  )
  await page.goto('/app/repairs/demo/changes')
  await expect(
    page.getByRole('heading', { name: 'Start with a little investigation.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Open diagnosis', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Run demo diagnosis', exact: true })).toBeVisible()
})

test('P1: corrupt JSON and invalid UI preferences recover without replacing store actions', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('phoenix-demo-v2', '{unreadable')
    localStorage.setItem(
      'phoenix-ui-v1',
      JSON.stringify({
        version: 0,
        state: {
          sidebarCollapsed: 'false',
          reduceMotion: {},
          toggleSidebar: null,
          setCommandOpen: false,
        },
      }),
    )
  })
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Recent projects', exact: true })).toBeVisible()
  await expect(
    page.getByRole('status').filter({ hasText: 'Saved demo data recovered.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeVisible()
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('combobox', { name: 'Search pages' })).toBeVisible()
  await page.keyboard.press('Escape')
})

test('P1: a failed optional editor falls back without losing the session or file selection', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/MonacoDiff*', (route) => route.abort('failed'))
  await page.goto('/app/repairs/px-1041/changes')
  await expect(
    page.getByRole('status').filter({ hasText: 'interactive editor is unavailable' }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', { name: /Unified code comparison for src\/components/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Home.tsx/ }).click()
  await expect(
    page.getByRole('region', {
      name: 'Unified code comparison for src/pages/Home.tsx',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Something interrupted your workspace.' }),
  ).toHaveCount(0)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
  await mkdir('docs/screenshots/phase6', { recursive: true })
  await page.screenshot({
    path: 'docs/screenshots/phase6/editor-unavailable-desktop.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('link', { name: 'Preview repair', exact: true }).click()
  await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
  expect(errors).toEqual([])
})
