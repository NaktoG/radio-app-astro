import { expect, test, type Page } from '@playwright/test'

const DIAGNOSTIC_AUTH_HEADER = 'x-radio-app-local-diagnostic-auth'
const DIAGNOSTIC_AUTH_HEADER_VALUE = 'measure-player-route'

const REQUIRED_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
]

const DIAGNOSTIC_USER = {
  id: 'local-diagnostic-user',
  username: 'diagnostic_user',
  role: 'diagnostic',
  createdAt: '2026-07-29T00:00:00.000Z',
  favorites: [],
  preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
}

const STATIONS_FIXTURE = [
  {
    changeuuid: 'change-1',
    stationuuid: 'station-1',
    name: 'Diagnostic Radio One With Long Mobile Name',
    url: 'https://local.invalid/stream-one.mp3',
    url_resolved: 'https://local.invalid/stream-one.mp3',
    homepage: '',
    favicon: '',
    tags: 'news, talk, music, diagnostic, mobile',
    country: 'Argentina',
    countrycode: 'AR',
    state: '',
    language: 'Spanish',
    languagecodes: 'es',
    votes: 9999,
    codec: 'MP3',
    bitrate: 320,
    clickcount: 0,
    clicktrend: 0,
    ssl_error: 0,
    geo_lat: null,
    geo_long: null,
    has_extended_info: false,
    lastcheckok: 1,
  },
  {
    changeuuid: 'change-2',
    stationuuid: 'station-2',
    name: 'Diagnostic Radio Two',
    url: 'https://local.invalid/stream-two.mp3',
    url_resolved: 'https://local.invalid/stream-two.mp3',
    homepage: '',
    favicon: '',
    tags: 'jazz, culture',
    country: 'Uruguay',
    countrycode: 'UY',
    state: '',
    language: 'Spanish',
    languagecodes: 'es',
    votes: 42,
    codec: 'AAC',
    bitrate: 128,
    clickcount: 0,
    clicktrend: 0,
    ssl_error: 0,
    geo_lat: null,
    geo_long: null,
    has_extended_info: false,
    lastcheckok: 1,
  },
]

async function installLocalDiagnostics(page: Page, options: { forceAudioError?: boolean } = {}) {
  await page.setExtraHTTPHeaders({ [DIAGNOSTIC_AUTH_HEADER]: DIAGNOSTIC_AUTH_HEADER_VALUE })
  await page.addInitScript(({ forceAudioError }) => {
    window.localStorage.removeItem('radio_current_station')
    if (forceAudioError) {
      const originalSetTimeout = window.setTimeout.bind(window)
      window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
        originalSetTimeout(
          handler,
          timeout && timeout >= 1000 ? 0 : timeout,
          ...args
        )) as typeof window.setTimeout
    }

    class DiagnosticAudio {
      src = ''
      preload = ''
      volume = 0.7
      muted = false
      paused = true
      onerror: (() => void) | null = null
      oncanplay: (() => void) | null = null
      onplay: (() => void) | null = null

      constructor(src?: string) {
        this.src = src ?? ''
      }

      load() {
        setTimeout(() => (forceAudioError ? this.onerror?.() : this.oncanplay?.()), 0)
      }

      async play() {
        if (forceAudioError) {
          this.onerror?.()
          throw new Error('Diagnostic audio failure')
        }
        this.paused = false
        this.onplay?.()
      }

      pause() {
        this.paused = true
      }
    }

    Object.defineProperty(window, 'Audio', {
      configurable: true,
      writable: true,
      value: DiagnosticAudio,
    })
  }, options)

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { success: true, user: DIAGNOSTIC_USER } })
  })
  await page.route('**/api/favorites', async (route) => {
    await route.fulfill({ json: { success: true, favorites: [] } })
  })
  await page.route('**/api/stations**', async (route) => {
    await route.fulfill({ json: STATIONS_FIXTURE })
  })
}

test.describe('Player local runtime diagnostics', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(120000)

  test('measures /player at required mobile/tablet viewports without remote data calls', async ({
    page,
  }, testInfo) => {
    await installLocalDiagnostics(page)

    const reports = []

    for (const viewport of REQUIRED_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await page.goto('/player')
      await expect(page).toHaveURL(/\/player$/)
      await expect(page.getByRole('heading', { name: 'Reproductor' })).toBeVisible()
      await expect(page.getByRole('listbox', { name: 'Lista de estaciones' })).toBeVisible()
      await page.getByRole('option', { name: /Diagnostic Radio One/ }).click()
      const selectedPlayerHeading = page.getByRole('heading', { name: /Diagnostic Radio One/ })
      await expect(selectedPlayerHeading).toBeVisible()
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto'
        document.body.style.scrollBehavior = 'auto'
        window.scrollTo(0, document.documentElement.scrollHeight)
      })
      await page.waitForTimeout(50)

      const report = await page.evaluate(({ width, height }) => {
        const viewportWidth = document.documentElement.clientWidth
        const viewportHeight = document.documentElement.clientHeight
        const visibleEnough = (rect: DOMRect) => rect.width > 0 && rect.height > 0
        const selectorFor = (node: Element) => {
          const parts = []
          let current: Element | null = node
          while (current && parts.length < 4) {
            const id = current.id ? `#${current.id}` : ''
            const classes = String(current.getAttribute('class') ?? '')
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 3)
              .map((className) => `.${CSS.escape(className)}`)
              .join('')
            parts.unshift(`${current.tagName.toLowerCase()}${id}${classes}`)
            current = current.parentElement
          }
          return parts.join(' > ')
        }

        const overflowingNodes = Array.from(document.querySelectorAll('body *'))
          .map((node) => {
            const rect = node.getBoundingClientRect()
            const overflowLeft = Math.max(0, -rect.left)
            const overflowRight = Math.max(0, rect.right - viewportWidth)
            return { node, rect, overflowLeft, overflowRight }
          })
          .filter(
            ({ rect, overflowLeft, overflowRight }) =>
              visibleEnough(rect) && (overflowLeft > 1 || overflowRight > 1)
          )
          .map(({ node, rect, overflowLeft, overflowRight }) => ({
            selector: selectorFor(node),
            tagName: node.tagName.toLowerCase(),
            text: (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90),
            rect: {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
            overflowLeft: Math.round(overflowLeft),
            overflowRight: Math.round(overflowRight),
          }))

        const serializableRect = (
          rect:
            | DOMRect
            | {
                top: number
                right: number
                bottom: number
                left: number
                width: number
                height: number
              }
        ) => ({
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })

        const intersectRects = (
          a: { top: number; right: number; bottom: number; left: number },
          b: { top: number; right: number; bottom: number; left: number }
        ) => {
          const left = Math.max(a.left, b.left)
          const right = Math.min(a.right, b.right)
          const top = Math.max(a.top, b.top)
          const bottom = Math.min(a.bottom, b.bottom)
          return {
            top,
            right,
            bottom,
            left,
            width: Math.max(0, right - left),
            height: Math.max(0, bottom - top),
          }
        }

        const clipsOverflow = (value: string) =>
          ['hidden', 'clip', 'scroll', 'auto'].includes(value)

        const opacityThreshold = 0.01

        const controlDiagnostic = (node: Element | null) => {
          if (!node) {
            return {
              present: false,
              rect: null,
              clippedRect: null,
              visibleArea: 0,
              partiallyVisible: false,
              fullyVisible: false,
              centerInViewport: false,
              hiddenReasons: ['missing'],
              viewportClipped: false,
              clippingAncestorSelector: null,
              clippingAncestors: [],
              effectiveOpacity: 0,
              ancestorOpacityHidden: false,
              opacityAncestors: [],
              disabled: false,
              ariaDisabled: false,
            }
          }

          const rect = node.getBoundingClientRect()
          const style = window.getComputedStyle(node)
          const hiddenReasons: string[] = []
          const opacity = Number.parseFloat(style.opacity || '1')
          let effectiveOpacity = Number.isFinite(opacity) ? opacity : 1
          let ancestorOpacityHidden = false
          const opacityAncestors = []
          const disabled = 'disabled' in node && Boolean((node as HTMLButtonElement).disabled)
          const ariaDisabled = node.getAttribute('aria-disabled') === 'true'

          if (style.display === 'none') hiddenReasons.push('display:none')
          if (style.visibility === 'hidden' || style.visibility === 'collapse') {
            hiddenReasons.push(`visibility:${style.visibility}`)
          }
          if (!Number.isFinite(opacity) || opacity <= opacityThreshold)
            hiddenReasons.push(`opacity:${style.opacity}`)
          if (style.pointerEvents === 'none') hiddenReasons.push('pointer-events:none')
          if (disabled) hiddenReasons.push('disabled')
          if (ariaDisabled) hiddenReasons.push('aria-disabled:true')
          if (rect.width <= 0 || rect.height <= 0) hiddenReasons.push('empty-rect')

          const clippingAncestors = []
          let clippedRect = intersectRects(rect, {
            top: 0,
            right: viewportWidth,
            bottom: viewportHeight,
            left: 0,
          })
          const viewportClipped =
            clippedRect.left > rect.left + 0.5 ||
            clippedRect.top > rect.top + 0.5 ||
            clippedRect.right < rect.right - 0.5 ||
            clippedRect.bottom < rect.bottom - 0.5
          let current = node.parentElement
          while (current) {
            const currentStyle = window.getComputedStyle(current)
            const ancestorOpacity = Number.parseFloat(currentStyle.opacity || '1')
            if (currentStyle.display === 'none') {
              hiddenReasons.push(`ancestor-display:none:${selectorFor(current)}`)
            }
            if (currentStyle.visibility === 'hidden' || currentStyle.visibility === 'collapse') {
              hiddenReasons.push(
                `ancestor-visibility:${currentStyle.visibility}:${selectorFor(current)}`
              )
            }
            if (Number.isFinite(ancestorOpacity)) {
              effectiveOpacity *= ancestorOpacity
              if (ancestorOpacity <= opacityThreshold) {
                ancestorOpacityHidden = true
                opacityAncestors.push({
                  selector: selectorFor(current),
                  opacity: currentStyle.opacity,
                })
              }
            }

            if (clipsOverflow(currentStyle.overflowX) || clipsOverflow(currentStyle.overflowY)) {
              const before = clippedRect
              const ancestorRect = current.getBoundingClientRect()
              clippedRect = intersectRects(clippedRect, ancestorRect)
              const reduced = clippedRect.width < before.width || clippedRect.height < before.height

              if (reduced) {
                clippingAncestors.push({
                  selector: selectorFor(current),
                  overflowX: currentStyle.overflowX,
                  overflowY: currentStyle.overflowY,
                  rect: serializableRect(ancestorRect),
                })
              }
            }
            current = current.parentElement
          }

          if (ancestorOpacityHidden) hiddenReasons.push('ancestor-opacity')
          if (effectiveOpacity <= opacityThreshold) hiddenReasons.push('effective-opacity')
          if (viewportClipped) hiddenReasons.push('viewport-clipped')
          if (clippingAncestors.length > 0) hiddenReasons.push('ancestor-clipped')

          const visibleArea = Math.round(clippedRect.width * clippedRect.height)
          const centerX = rect.left + rect.width / 2
          const centerY = rect.top + rect.height / 2
          const clippedFullyContainsRawRect =
            clippedRect.left <= rect.left + 0.5 &&
            clippedRect.top <= rect.top + 0.5 &&
            clippedRect.right >= rect.right - 0.5 &&
            clippedRect.bottom >= rect.bottom - 0.5

          return {
            present: true,
            rect: serializableRect(rect),
            clippedRect: serializableRect(clippedRect),
            visibleArea,
            partiallyVisible: hiddenReasons.length === 0 && visibleArea > 0,
            fullyVisible:
              hiddenReasons.length === 0 &&
              rect.width > 0 &&
              rect.height > 0 &&
              visibleArea > 0 &&
              clippedFullyContainsRawRect,
            centerInViewport:
              centerX >= 0 && centerX <= viewportWidth && centerY >= 0 && centerY <= viewportHeight,
            hiddenReasons,
            viewportClipped,
            clippingAncestorSelector: clippingAncestors[0]?.selector ?? null,
            clippingAncestors,
            effectiveOpacity: Number(effectiveOpacity.toFixed(4)),
            ancestorOpacityHidden,
            opacityAncestors,
            disabled,
            ariaDisabled,
          }
        }

        const selectedStationHeading = Array.from(document.querySelectorAll('h2')).find((node) =>
          node.textContent?.includes('Diagnostic Radio One')
        )
        const playerCard = selectedStationHeading?.closest('.card, .card-glow') ?? document
        const playButton = Array.from(playerCard.querySelectorAll('button')).find((node) =>
          ['Reproducir', 'Pausar', 'Cargando stream'].includes(
            node.getAttribute('aria-label') ?? ''
          )
        )
        const nextButton = Array.from(playerCard.querySelectorAll('button')).find(
          (node) => node.getAttribute('aria-label') === 'Siguiente'
        )

        const selectedStationMetadata = Array.from(playerCard.querySelectorAll('p')).find((node) =>
          node.textContent?.includes('news, talk, music, diagnostic, mobile')
        )
        const errorAlert = playerCard.querySelector('[role="alert"]')

        const rectFor = (node: Element | null) =>
          node ? serializableRect(node.getBoundingClientRect()) : null

        const overlaps = (
          a: { top: number; right: number; bottom: number; left: number } | null,
          b: { top: number; right: number; bottom: number; left: number } | null
        ) =>
          Boolean(
            a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
          )

        const targetRects = {
          selectedStationHeading: rectFor(selectedStationHeading ?? null),
          selectedStationMetadata: rectFor(selectedStationMetadata ?? null),
          errorAlert: rectFor(errorAlert),
        }
        const controlRects = {
          playButton: rectFor(playButton ?? null),
          nextButton: rectFor(nextButton ?? null),
          volumeSlider: rectFor(playerCard.querySelector('input[aria-label="Volumen"]')),
        }

        const controlOverlaps = Object.entries(controlRects).flatMap(([controlName, controlRect]) =>
          Object.entries(targetRects)
            .filter(([, targetRect]) => overlaps(controlRect, targetRect))
            .map(([targetName, targetRect]) => ({
              controlName,
              targetName,
              controlRect,
              targetRect,
            }))
        )

        const controlVisibility = {
          listbox: controlDiagnostic(document.querySelector('[role="listbox"]')),
          selectedStationHeading: controlDiagnostic(selectedStationHeading ?? null),
          selectedStationMetadata: controlDiagnostic(selectedStationMetadata ?? null),
          errorAlert: controlDiagnostic(errorAlert),
          playButton: controlDiagnostic(playButton ?? null),
          nextButton: controlDiagnostic(nextButton ?? null),
          volumeSlider: controlDiagnostic(playerCard.querySelector('input[aria-label="Volumen"]')),
        }

        const opacityHiddenAncestor = document.createElement('div')
        opacityHiddenAncestor.style.opacity = '0'
        opacityHiddenAncestor.style.position = 'fixed'
        opacityHiddenAncestor.style.top = '24px'
        opacityHiddenAncestor.style.left = '24px'
        opacityHiddenAncestor.style.width = '120px'
        opacityHiddenAncestor.style.height = '40px'

        const opacityHiddenControl = document.createElement('button')
        opacityHiddenControl.textContent = 'Opacity hidden diagnostic control'
        opacityHiddenControl.style.width = '100px'
        opacityHiddenControl.style.height = '32px'
        opacityHiddenAncestor.append(opacityHiddenControl)
        document.body.append(opacityHiddenAncestor)

        const diagnosticSelfChecks = {
          opacityHiddenAncestor: controlDiagnostic(opacityHiddenControl),
        }

        opacityHiddenAncestor.remove()

        return {
          viewport: { width, height },
          document: {
            clientWidth: viewportWidth,
            scrollWidth: document.documentElement.scrollWidth,
            clientHeight: viewportHeight,
            scrollHeight: document.documentElement.scrollHeight,
            bodyScrollWidth: document.body.scrollWidth,
          },
          controlVisibility,
          controlOverlaps,
          diagnosticSelfChecks,
          overflowingNodes,
        }
      }, viewport)

      reports.push(report)
      console.log(`PLAYER_DIAGNOSTIC ${JSON.stringify(report)}`)
    }

    await testInfo.attach('player-runtime-diagnostics.json', {
      contentType: 'application/json',
      body: JSON.stringify(reports, null, 2),
    })

    expect(reports).toHaveLength(REQUIRED_VIEWPORTS.length)
    expect(
      reports.every((report) =>
        report.overflowingNodes.every((node) => !node.selector.includes('wave-bg'))
      )
    ).toBe(true)
    expect(
      reports.every((report) => report.controlVisibility.selectedStationHeading.fullyVisible)
    ).toBe(true)
    expect(reports.every((report) => report.controlVisibility.playButton.fullyVisible)).toBe(true)
    expect(reports.every((report) => report.controlVisibility.nextButton.fullyVisible)).toBe(true)
    expect(reports.every((report) => report.controlVisibility.volumeSlider.fullyVisible)).toBe(true)
    expect(
      reports.every((report) => report.controlVisibility.selectedStationMetadata.fullyVisible)
    ).toBe(true)
    expect(reports.every((report) => report.controlOverlaps.length === 0)).toBe(true)
    expect(
      reports.every(
        (report) => report.diagnosticSelfChecks.opacityHiddenAncestor.ancestorOpacityHidden === true
      )
    ).toBe(true)
    expect(
      reports.every(
        (report) => report.diagnosticSelfChecks.opacityHiddenAncestor.fullyVisible === false
      )
    ).toBe(true)
  })

  test('keeps mobile/tablet player controls from overlapping the stream error alert', async ({
    page,
  }, testInfo) => {
    await installLocalDiagnostics(page, { forceAudioError: true })

    const reports = []

    for (const viewport of REQUIRED_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await page.goto('/player')
      await expect(page.getByRole('listbox', { name: 'Lista de estaciones' })).toBeVisible()
      await page.getByRole('option', { name: /Diagnostic Radio One/ }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto'
        document.body.style.scrollBehavior = 'auto'
        window.scrollTo(0, document.documentElement.scrollHeight)
      })
      await page.waitForTimeout(50)

      const report = await page.evaluate(({ width, height }) => {
        const viewportWidth = document.documentElement.clientWidth
        const viewportHeight = document.documentElement.clientHeight
        const serializableRect = (rect: DOMRect) => ({
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })
        const rectFor = (node: Element | null) =>
          node ? serializableRect(node.getBoundingClientRect()) : null
        const overlaps = (
          a: { top: number; right: number; bottom: number; left: number } | null,
          b: { top: number; right: number; bottom: number; left: number } | null
        ) =>
          Boolean(
            a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
          )
        const visibleInViewport = (rect: ReturnType<typeof rectFor>) =>
          Boolean(
            rect &&
            rect.width > 0 &&
            rect.height > 0 &&
            rect.left >= 0 &&
            rect.top >= 0 &&
            rect.right <= viewportWidth &&
            rect.bottom <= viewportHeight
          )

        const selectedStationHeading = Array.from(document.querySelectorAll('h2')).find((node) =>
          node.textContent?.includes('Diagnostic Radio One')
        )
        const playerCard = selectedStationHeading?.closest('.card, .card-glow') ?? document
        const selectedStationMetadata = Array.from(playerCard.querySelectorAll('p')).find((node) =>
          node.textContent?.includes('news, talk, music, diagnostic, mobile')
        )
        const errorAlert = playerCard.querySelector('[role="alert"]')
        const playButton = Array.from(playerCard.querySelectorAll('button')).find((node) =>
          ['Reproducir', 'Pausar', 'Cargando stream'].includes(
            node.getAttribute('aria-label') ?? ''
          )
        )
        const nextButton = Array.from(playerCard.querySelectorAll('button')).find(
          (node) => node.getAttribute('aria-label') === 'Siguiente'
        )

        const targetRects = {
          selectedStationHeading: rectFor(selectedStationHeading ?? null),
          selectedStationMetadata: rectFor(selectedStationMetadata ?? null),
          errorAlert: rectFor(errorAlert),
        }
        const controlRects = {
          playButton: rectFor(playButton ?? null),
          nextButton: rectFor(nextButton ?? null),
          volumeSlider: rectFor(playerCard.querySelector('input[aria-label="Volumen"]')),
        }

        return {
          viewport: { width, height },
          controlRects,
          targetRects,
          controlOverlaps: Object.entries(controlRects).flatMap(([controlName, controlRect]) =>
            Object.entries(targetRects)
              .filter(([, targetRect]) => overlaps(controlRect, targetRect))
              .map(([targetName, targetRect]) => ({
                controlName,
                targetName,
                controlRect,
                targetRect,
              }))
          ),
          controlsFullyVisible: Object.values(controlRects).every(visibleInViewport),
          targetsFullyVisible: Object.values(targetRects).every(visibleInViewport),
        }
      }, viewport)

      reports.push(report)
      console.log(`PLAYER_ERROR_OVERLAP_DIAGNOSTIC ${JSON.stringify(report)}`)
    }

    await testInfo.attach('player-error-overlap-diagnostics.json', {
      contentType: 'application/json',
      body: JSON.stringify(reports, null, 2),
    })

    expect(reports).toHaveLength(REQUIRED_VIEWPORTS.length)
    expect(reports.every((report) => report.controlsFullyVisible)).toBe(true)
    expect(reports.every((report) => report.targetsFullyVisible)).toBe(true)
    expect(reports.every((report) => report.controlOverlaps.length === 0)).toBe(true)
  })
})
