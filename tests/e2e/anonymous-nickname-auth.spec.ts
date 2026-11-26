import { expect, test, type Page } from '@playwright/test'

const diagnosticHeaders = {
  'x-radio-app-local-diagnostic-auth': 'measure-player-route',
}

const profile = {
  userId: '00000000-0000-4000-8000-0000000000e2',
  nickname: 'E2E Listener',
  acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
  favorites: [],
  preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
}

async function authProfileStorageKeys(page: Page) {
  return page.evaluate(() =>
    [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter((key) =>
      /(supabase|auth|profile|favorite|radio_favorites)/i.test(key)
    )
  )
}

async function isMobileViewport(page: Page) {
  const viewport = page.viewportSize()
  return Boolean(viewport && viewport.width < 768)
}

async function openMobileNavIfNeeded(page: Page) {
  if (!(await isMobileViewport(page))) return
  const openButton = page.getByRole('button', { name: /abrir menú|open menu/i })
  if (!(await openButton.isVisible())) return
  await expect(async () => {
    await openButton.click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 10_000 })
}

async function expectNicknameVisible(page: Page, nickname: string) {
  if (await isMobileViewport(page)) {
    await openMobileNavIfNeeded(page)
    await expect(page.getByRole('menu').getByText(new RegExp(nickname))).toBeVisible()
  } else {
    await expect(page.getByText(new RegExp(nickname))).toBeVisible()
  }
}

async function clickSignOut(page: Page) {
  await openMobileNavIfNeeded(page)
  if (await isMobileViewport(page)) {
    await page.getByRole('menuitem', { name: /salir|sign out/i }).click()
  } else {
    await page.getByRole('button', { name: /salir|sign out/i }).click()
  }
}

async function mockRestoredSession(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      json: { success: true, user: profile, message: 'Anonymous profile restored.' },
    })
  })
  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        message:
          'Anonymous session closed. Anonymous accounts may not be recoverable after logout.',
      },
    })
  })
}

async function mockStationsAndFavorites(page: Page, failFavoriteMutation = false) {
  await page.route('**/api/stations**', async (route) => {
    await route.fulfill({
      json: [
        {
          stationuuid: 'station-a',
          name: 'Rollback Radio',
          country: 'Argentina',
          tags: 'rock',
          codec: 'MP3',
          bitrate: 128,
          votes: 42,
          lastcheckok: 1,
          url: 'https://example.com/stream.mp3',
          url_resolved: 'https://example.com/stream.mp3',
          favicon: '',
        },
      ],
    })
  })
  await page.route('**/api/favorites', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { success: true, favorites: [] } })
      return
    }
    await route.fulfill({
      status: failFavoriteMutation ? 500 : 200,
      json: { success: !failFavoriteMutation },
    })
  })
}

test.describe('anonymous nickname auth readiness', () => {
  test('blocks direct /player access without a restored anonymous profile', async ({ page }) => {
    await page.goto('/player')

    await expect(page).toHaveURL(/\/auth\/profile$/)
    await expect(
      page.getByRole('heading', { level: 1, name: /perfil anónimo|anonymous profile/i })
    ).toBeVisible()
    await expect.poll(() => authProfileStorageKeys(page)).toEqual([])
  })

  test('renders /player with a mocked diagnostic restored profile without auth storage', async ({
    browser,
  }) => {
    const context = await browser.newContext({ extraHTTPHeaders: diagnosticHeaders })
    const page = await context.newPage()
    await mockRestoredSession(page)
    await mockStationsAndFavorites(page)

    await page.goto('/player')
    await expect(page.getByRole('heading', { name: /reproductor|player/i })).toBeVisible()
    await expectNicknameVisible(page, 'E2E Listener')
    await expect(page.getByText('Rollback Radio')).toBeVisible()
    await page.reload()
    await expectNicknameVisible(page, 'E2E Listener')
    await expect.poll(() => authProfileStorageKeys(page)).toEqual([])
    await context.close()
  })

  test('requires the risk modal before profile creation and rejects duplicate normalized nicknames', async ({
    page,
  }) => {
    const requests: unknown[] = []
    await page.route('**/api/auth/anonymous', async (route) => {
      const body = route.request().postDataJSON()
      requests.push(body)
      await route.fulfill({
        status: String(body.nickname).toLowerCase() === 'radio fan' ? 409 : 200,
        json:
          String(body.nickname).toLowerCase() === 'radio fan'
            ? {
                success: false,
                message: 'That nickname is already taken. Choose another display nickname.',
              }
            : { success: true, user: profile, message: 'Anonymous profile created.' },
      })
    })

    await page.goto('/auth/profile')
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/apodo|nickname/i).fill('  Radio Fan  ')
    await page.getByRole('button', { name: /continuar|continue/i }).click()
    expect(requests).toEqual([])
    await expect(
      page.getByRole('dialog', { name: /riesgo de cuenta anónima|anonymous account risk/i })
    ).toBeVisible()
    await page
      .getByRole('button', { name: /entiendo, crear perfil|i understand, create profile/i })
      .click()

    await expect(page.getByRole('alert')).toContainText(/already taken|ya está en uso/i)
    expect(JSON.stringify(requests)).toContain('Radio Fan')
    expect(JSON.stringify(requests).toLowerCase()).not.toMatch(
      /password|credential|recovery|authorization/
    )
    await expect.poll(() => authProfileStorageKeys(page)).toEqual([])
  })

  test('warns about anonymous account recovery risk before logout redirects home', async ({
    browser,
  }) => {
    const context = await browser.newContext({ extraHTTPHeaders: diagnosticHeaders })
    const page = await context.newPage()
    await mockRestoredSession(page)
    await mockStationsAndFavorites(page)
    await page.goto('/player')

    const warning = page.waitForEvent('dialog')
    await clickSignOut(page)
    expect((await warning).message()).toMatch(/may not be recoverable|no pueda recuperarse/i)
    await (await warning).accept()
    await expect(page).toHaveURL(/\/$/)
    await context.close()
  })

  test('rolls back a failed favorite mutation and keeps favorites out of storage', async ({
    browser,
  }) => {
    const context = await browser.newContext({ extraHTTPHeaders: diagnosticHeaders })
    const page = await context.newPage()
    await mockRestoredSession(page)
    await mockStationsAndFavorites(page, true)

    await page.goto('/player')
    const favoriteButton = page.getByRole('button', { name: /Rollback Radio.*favoritos/i })
    await favoriteButton.click()

    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => authProfileStorageKeys(page)).toEqual([])
    await context.close()
  })
})
