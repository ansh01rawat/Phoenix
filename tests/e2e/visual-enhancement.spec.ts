import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

test('visual system: readable type, glass hover, press, and original CTA navigation', async ({
  page,
}) => {
  await page.goto('/app')
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toHaveCSS('font-size', '40px')
  const action = page.locator('.page-heading-actions').getByRole('link', { name: 'New repair' })
  await expect(action).toHaveCSS('font-size', '14px')
  await expect(action).toHaveCSS('border-radius', '10px')
  await expect(action).toHaveCSS('color', 'rgb(246, 243, 255)')
  await action.hover()
  await expect
    .poll(() =>
      action.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42),
    )
    .toBeLessThan(-1)
  await mkdir('docs/screenshots/visual-enhancement', { recursive: true })
  await page.screenshot({
    path: 'docs/screenshots/visual-enhancement/after-dashboard-desktop.png',
    fullPage: true,
  })
  await page.mouse.down()
  await expect
    .poll(() => action.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a))
    .toBeLessThan(1)
  await page.mouse.up()
  await expect(page).toHaveURL('/app/repairs/new')
  await expect(page.getByRole('button', { name: 'Choose ZIP file', exact: true })).toBeVisible()
})

test('visual motion respects operating-system and saved reduced-motion preferences', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/app')
  let action = page.locator('.page-heading-actions').getByRole('link', { name: 'New repair' })
  await action.hover()
  await expect(action).toHaveCSS('transform', 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/app/settings')
  await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click()
  await page.goto('/app')
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true')
  action = page.locator('.page-heading-actions').getByRole('link', { name: 'New repair' })
  await action.hover()
  await expect(action).toHaveCSS('transform', 'none')
})
