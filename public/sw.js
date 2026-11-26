// Caching is opt-in on production. Existing preview installations update to
// this pass-through worker instead of intercepting Vercel's SSO redirects.
const CACHE_ENABLED = new URL(self.location.href).searchParams.get('cache') === '1'
const CACHE_PREFIX = 'radio-app-'
const CACHE_VERSION = 'radio-app-v5'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PRECACHE_URLS = ['/offline.html', '/favicon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      if (CACHE_ENABLED) {
        try {
          const cache = await caches.open(STATIC_CACHE)
          await Promise.allSettled(
            PRECACHE_URLS.map(async (path) => {
              const response = await fetch(new URL(path, self.location.origin), {
                credentials: 'same-origin',
              })
              if (isCacheable(response)) await cache.put(path, response)
            })
          )
        } catch {
          /* Restricted storage must not prevent activation. */
        }
      }
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.allSettled(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && (!CACHE_ENABLED || key !== STATIC_CACHE)
            )
            .map((key) => caches.delete(key))
        )
      } catch {
        /* Private mode may deny cache storage. */
      }
      await self.clients.claim()
    })()
  )
})

function isCacheable(response) {
  return (
    response.ok &&
    !response.redirected &&
    response.type !== 'opaque' &&
    response.type !== 'opaqueredirect'
  )
}

function shouldBypass(request) {
  const url = new URL(request.url)
  return (
    !CACHE_ENABLED ||
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    request.headers.has('range') ||
    request.destination === 'audio' ||
    request.destination === 'video' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_vercel/') ||
    !(
      request.mode === 'navigate' ||
      url.pathname.startsWith('/_astro/') ||
      PRECACHE_URLS.includes(url.pathname)
    )
  )
}

async function readCached(request) {
  try {
    return await caches.match(request)
  } catch {
    return undefined
  }
}

async function networkFirst(request) {
  try {
    return await fetch(request)
  } catch {
    return (
      (await readCached('/offline.html')) ||
      new self.Response('Sin conexión. Volvé a intentarlo cuando tengas internet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    )
  }
}

async function cacheFirst(request) {
  const cached = await readCached(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (isCacheable(response)) {
      try {
        const cache = await caches.open(STATIC_CACHE)
        await cache.put(request, response.clone())
      } catch {
        /* Cache is an optimization, not a requirement. */
      }
    }
    return response
  } catch {
    // respondWith must resolve to a Response, even on a first visit offline.
    return new self.Response('', { status: 503, statusText: 'Service Unavailable' })
  }
}

self.addEventListener('fetch', (event) => {
  if (shouldBypass(event.request)) return
  event.respondWith(
    event.request.mode === 'navigate' ? networkFirst(event.request) : cacheFirst(event.request)
  )
})
