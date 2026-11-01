import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'

const screens = [
  ['dashboard', '/app'],
  ['projects', '/app/projects'],
  ['project-detail', '/app/projects/northstar'],
  ['history', '/app/repairs'],
  ['import', '/app/repairs/new'],
  ['diagnosis', '/app/repairs/px-1041/diagnosis'],
  ['changes', '/app/repairs/px-1041/changes'],
  ['preview', '/app/repairs/px-1041/preview'],
  ['tests', '/app/repairs/px-1041/tests'],
  ['review', '/app/repairs/px-1041/review'],
  ['settings', '/app/settings'],
] as const

for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [768, 1024],
  [390, 844],
]) {
  test(`Phase 6: all major screens at ${width}×${height}`, async ({ page }) => {
    test.setTimeout(90_000)
    const errors: string[] = []
    const sandboxDiagnostics: string[] = []
    const editorRequests: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      // Playwright trace snapshots attempt script evaluation inside opaque frames.
      // Record this exact expected security diagnostic; all other console errors fail.
      if (
        message.text() ===
        "Blocked script execution in 'about:srcdoc' because the document's frame is sandboxed and the 'allow-scripts' permission is not set."
      )
        sandboxDiagnostics.push(message.text())
      else errors.push(message.text())
    })
    page.on('request', (request) => {
      if (request.url().includes('/MonacoDiff')) editorRequests.push(request.url())
    })
    await page.setViewportSize({ width, height })
    await mkdir('docs/screenshots/phase6', { recursive: true })
    for (const [name, path] of screens) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (await page.locator('.page-container').count())
        await expect(page.locator('.page-container')).toHaveCSS('opacity', '1')
      if (name === 'dashboard') expect(editorRequests).toEqual([])
      if (name === 'changes') {
        if (width >= 900) {
          await expect(page.locator('.monaco-diff-editor')).toBeVisible()
          await expect(
            page.getByRole('textbox', {
              name: 'Original source for src/components/ProductGrid.tsx',
              exact: true,
            }),
          ).toBeAttached()
          await expect(
            page.getByRole('textbox', {
              name: 'Proposed demo repair for src/components/ProductGrid.tsx',
              exact: true,
            }),
          ).toBeAttached()
        } else {
          await expect(page.getByRole('region', { name: /Unified code comparison/ })).toBeVisible()
          expect(editorRequests).toEqual([])
        }
      }
      if (name === 'preview') {
        await expect(page.getByRole('group', { name: 'Sample website preview' })).toHaveAttribute(
          'aria-busy',
          'false',
        )
        await expect(page.frameLocator('iframe').getByRole('article')).toHaveCount(3)
        await expect(page.locator('iframe')).toHaveAttribute('sandbox', '')
        await expect(page.frameLocator('iframe').locator('script')).toHaveCount(0)
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width)
      await page.evaluate(() =>
        document.fonts.ready.then(() => window.scrollTo({ top: 0, behavior: 'instant' })),
      )
      await page.screenshot({
        path: `docs/screenshots/phase6/${name}-${width}x${height}.png`,
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
          result.violations.map((violation) => ({
            id: violation.id,
            targets: violation.nodes.map((node) => node.target),
          })),
          name,
        ).toEqual([])
      }
    }
    expect(errors).toEqual([])
    if (sandboxDiagnostics.length)
      await test.info().attach('expected-isolated-frame-trace-diagnostics', {
        body: JSON.stringify(
          {
            cause: 'Playwright trace snapshots; reproduced only with tracing enabled',
            messages: sandboxDiagnostics,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      })
  })
}

test('Phase 6: invalid ZIP, bounded size, cancelled import, removal, and drop errors recover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/app/repairs/new')
  const picker = page.getByLabel('Choose ZIP archive', { exact: true })
  await picker.setInputFiles({
    name: 'readme.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('ordinary text'),
  })
  await expect(page.getByRole('alert')).toContainText('Choose a ZIP archive')
  await picker.setInputFiles({
    name: 'too-large.zip',
    mimeType: 'application/zip',
    buffer: Buffer.alloc(20 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole('alert')).toContainText('up to 20 MB')
  await picker.setInputFiles('public/demo/forma-storefront.zip')
  await expect(page.getByRole('button', { name: 'Start demo repair', exact: true })).toBeEnabled()
  await page.clock.install({ time: new Date('2026-11-01T08:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-01T08:00:01Z'))
  await page.getByRole('button', { name: 'Start demo repair', exact: true }).click()
  await expect(page.getByRole('progressbar', { name: 'Simulated import progress' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel simulation', exact: true }).click()
  await page.clock.runFor(2000)
  await expect(page).toHaveURL('/app/repairs/new')
  await expect(page.getByRole('button', { name: 'Start demo repair', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Remove file', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Start demo repair', exact: true })).toBeDisabled()
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add(new File(['invalid'], 'one.zip'))
    data.items.add(new File(['invalid'], 'two.zip'))
    return data
  })
  await page.locator('.file-dropzone').dispatchEvent('drop', { dataTransfer: transfer })
  await expect(page.getByRole('alert')).toContainText('Choose one ZIP archive at a time')
})
