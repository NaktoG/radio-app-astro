import type { Radio, StationFilter } from './types'
import { normalizeStations } from './stations/normalize'
import { TimedCache } from './stations/cache'

const cache = new TimedCache<Radio[]>(50)
const pending = new Map<string, Promise<Radio[]>>()
const FRESH_MS = 3 * 60_000

async function requestStations(
  path: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<Radio[]> {
  const query = new URLSearchParams({ _path: path })
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  query.sort()
  const url = `/api/stations?${query}`
  const cached = cache.get(url, FRESH_MS)
  if (cached !== undefined) return cached
  const existing = pending.get(url)
  if (existing) return existing
  const request = (async () => {
    // Server failover has a 6-second ceiling; the client must not time out first.
    const response = await fetch(url, {
      signal: AbortSignal.timeout(9_000),
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error('El directorio de emisoras no está disponible')
    const payload: unknown = await response.json()
    const stations = normalizeStations(payload)
    if (response.headers.get('X-Radio-Directory') !== 'stale') cache.set(url, stations)
    return stations
  })().finally(() => pending.delete(url))
  pending.set(url, request)
  return request
}
export function fetchStations(filters: Partial<StationFilter> = {}): Promise<Radio[]> {
  return requestStations('/json/stations/search', {
    countrycode: 'AR',
    limit: 150,
    order: 'votes',
    reverse: true,
    ...filters,
  })
}
export function searchStations(query: string, country?: string, tag?: string): Promise<Radio[]> {
  return requestStations('/json/stations/search', {
    name: query,
    countrycode: country,
    tag,
    limit: 50,
    order: 'votes',
    reverse: true,
  })
}
export function fetchStationsByUuids(uuids: string[]): Promise<Radio[]> {
  if (!uuids.length) return Promise.resolve([])
  return requestStations('/json/stations/byuuid', { uuids: [...new Set(uuids)].sort().join(',') })
}
