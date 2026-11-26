import type { APIRoute } from 'astro'
import { stationDirectory } from '../../lib/server/stationDirectory'

const ALLOWED_PATHS = new Set(['/json/stations/search', '/json/stations/byuuid'])
const ALLOWED_PARAMS = new Set([
  'countrycode',
  'tag',
  'name',
  'limit',
  'offset',
  'order',
  'reverse',
  'uuids',
])

export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get('_path') || '/json/stations/search'
  if (!ALLOWED_PATHS.has(path))
    return Response.json({ error: { code: 'INVALID_PATH' } }, { status: 400 })
  const params = new URLSearchParams()
  for (const [key, value] of url.searchParams) {
    if (!ALLOWED_PARAMS.has(key)) continue
    if (value.length > (key === 'uuids' ? 6000 : 200))
      return Response.json({ error: { code: 'INVALID_FILTER' } }, { status: 400 })
    params.set(key, value)
  }
  if (path.endsWith('/search')) {
    const limit = Number(params.get('limit') || 36)
    const offset = Number(params.get('offset') || 0)
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(offset) || offset < 0)
      return Response.json({ error: { code: 'INVALID_FILTER' } }, { status: 400 })
    params.set('limit', String(Math.min(limit, 150)))
    params.set('offset', String(Math.min(offset, 10000)))
    params.set('hidebroken', 'true')
  } else if (!params.get('uuids')) return Response.json([])
  try {
    const { stations, source } = await stationDirectory.get(path, params)
    return Response.json(stations, {
      headers: {
        'Cache-Control':
          source === 'stale'
            ? 'no-store'
            : 'public, max-age=60, s-maxage=300, stale-while-revalidate=600, stale-if-error=3600',
        'X-Radio-Directory': source,
      },
    })
  } catch {
    return Response.json(
      {
        error: {
          code: 'DIRECTORY_UNAVAILABLE',
          message: 'El directorio no responde. Reintentá en unos segundos.',
        },
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '20' },
      }
    )
  }
}
