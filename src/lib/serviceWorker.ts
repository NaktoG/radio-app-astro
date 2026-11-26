/** Keep preview authentication requests out of the service worker cache. */
export async function initializeServiceWorker(enabled: boolean): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    if (enabled) {
      await navigator.serviceWorker.register('/sw.js?cache=1', { updateViaCache: 'none' })
      return
    }
    const registrations = await navigator.serviceWorker.getRegistrations()
    const own = registrations.filter((registration) => {
      const worker = registration.active || registration.waiting || registration.installing
      return (
        worker &&
        new URL(worker.scriptURL).origin === location.origin &&
        new URL(worker.scriptURL).pathname === '/sw.js'
      )
    })
    if (own.length) {
      // Install the pass-through revision before unregistering so existing tabs
      // stop using the old fetch handler without forcing a playback-disrupting reload.
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
      })
      const worker = registration.installing || registration.waiting
      if (worker && worker.state !== 'activated') {
        await new Promise<void>((resolve) => {
          const finish = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') {
              worker.removeEventListener('statechange', finish)
              resolve()
            }
          }
          worker.addEventListener('statechange', finish)
          finish()
        })
      }
      await registration.unregister()
    }
  } catch (error: unknown) {
    // Optional offline support must never prevent listening.
    console.warn(
      'Radio App: offline support is unavailable.',
      error instanceof Error ? error.name : 'UnknownError'
    )
  }
}
