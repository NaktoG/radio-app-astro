import type { APIRoute } from 'astro'

const MIRRORS = [
  'https://all.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://fr1.api.radio-browser.info',
]

const CACHE_TTL = 60_000
const FETCH_TIMEOUT_MS = 12_000
const MAX_LIMIT = 150
const cache = new Map<string, { data: unknown; expiry: number }>()
const ALLOWED_PATHS = new Set(['/json/stations/search', '/json/stations/byuuid'])

function clampLimit(limit: string | null): string | null {
  if (!limit) return null
  const n = Number(limit)
  if (!Number.isFinite(n) || n <= 0) return null
  return String(Math.min(Math.floor(n), MAX_LIMIT))
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const params = new URLSearchParams(url.searchParams)
    params.delete('_')

    const path = params.get('_path') || '/json/stations/search'
    params.delete('_path')

    if (!ALLOWED_PATHS.has(path)) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_PATH', message: 'Invalid API path' },
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }

    const normalizedLimit = clampLimit(params.get('limit'))
    if (normalizedLimit) params.set('limit', normalizedLimit)

    const cacheKey = `${path}?${params.toString()}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.expiry) {
      return new Response(JSON.stringify(cached.data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      })
    }

    let lastError: Error | null = null
    for (const mirror of MIRRORS) {
      try {
        const apiUrl = `${mirror}${path}?${params.toString()}`
        const response = await fetch(apiUrl, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'RadioApp/1.0 (+https://github.com/NaktoG/radio-app-astro)',
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })

        if (!response.ok) {
          lastError = new Error(`API ${mirror} returned ${response.status}`)
          continue
        }

        const data = await response.json()
        cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL })

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60',
          },
        })
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e))
      }
    }

    console.error('[api/stations] all mirrors failed', {
      path,
      params: params.toString(),
      lastError: lastError?.message ?? 'unknown',
    })

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'X-Radio-App-Fallback': 'direct',
      },
    })
  } catch {
    return new Response(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}
