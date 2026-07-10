import { test, expect } from '@playwright/test'

test.describe('Search page', () => {
  test('loads search form', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('form')).toBeVisible()
  })

  test('has search input with label', async ({ page }) => {
    await page.goto('/search')
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
  })
})
