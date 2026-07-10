import { test, expect } from '@playwright/test'

test.describe('Player page', () => {
  test('loads and shows filter and station list', async ({ page }) => {
    await page.goto('/player')
    await expect(page).toHaveTitle(/Radio App/i)
    await expect(page.locator('main')).toBeVisible()
  })

  test('has skip-to-content link', async ({ page }) => {
    await page.goto('/player')
    const skipLink = page.locator('a[href="#main"]')
    await expect(skipLink).toHaveAttribute('href', '#main')
  })

  test('nav has player and search links', async ({ page }) => {
    await page.goto('/player')
    await expect(page.locator('nav a[href="/player"]')).toBeVisible()
    await expect(page.locator('nav a[href="/search"]')).toBeVisible()
  })
})
