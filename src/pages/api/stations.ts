import type { APIRoute } from 'astro'

const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
]

const CACHE_TTL = 60_000
const cache = new Map<string, { data: unknown; expiry: number }>()

export const GET: APIRoute = async ({ url }) => {
  try {
    const params = new URLSearchParams(url.searchParams)
    params.delete('_')

    const path = params.get('_path') || '/json/stations/search'
    params.delete('_path')

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
          headers: { 'User-Agent': 'RadioApp/1.0' },
          signal: AbortSignal.timeout(8000),
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

    return new Response(
      JSON.stringify({
        error: { code: 'EXTERNAL_DEPENDENCY_ERROR', message: 'Radio Browser API unavailable' },
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
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
