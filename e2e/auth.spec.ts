import { test, expect } from '@playwright/test'

test.describe('Auth pages', () => {
  test('login page loads with form', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('register page loads with form', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('form')).toBeVisible()
  })

  test('login form has submit button', async ({ page }) => {
    await page.goto('/auth/login')
    const submit = page.locator('button[type="submit"]')
    await expect(submit).toBeVisible()
  })
})
