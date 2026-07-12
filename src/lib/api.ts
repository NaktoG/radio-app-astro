import type { Radio, StationFilter } from './types'

const DEFAULT_PARAMS: StationFilter = {
  countrycode: 'AR',
  limit: 150,
  order: 'votes',
  reverse: true,
}

const DIRECT_MIRRORS = [
  'https://all.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://fr1.api.radio-browser.info',
]

const REQUEST_TIMEOUT_MS = 10_000

function sanitizeStation(s: Record<string, unknown>): Radio | null {
  const name = typeof s.name === 'string' ? s.name.trim() : ''
  const url = typeof s.url === 'string' ? s.url : ''
  const url_resolved = typeof s.url_resolved === 'string' ? s.url_resolved : ''
  if (!url && !url_resolved) return null
  return {
    changeuuid: String(s.changeuuid ?? ''),
    stationuuid: String(s.stationuuid ?? ''),
    name,
    url,
    url_resolved,
    homepage: String(s.homepage ?? ''),
    favicon: String(s.favicon ?? ''),
    tags: String(s.tags ?? ''),
    country: String(s.country ?? ''),
    countrycode: String(s.countrycode ?? ''),
    state: String(s.state ?? ''),
    language: String(s.language ?? ''),
    languagecodes: String(s.languagecodes ?? ''),
    votes: Number(s.votes) || 0,
    codec: String(s.codec ?? ''),
    bitrate: Number(s.bitrate) || 0,
    clickcount: Number(s.clickcount) || 0,
    clicktrend: Number(s.clicktrend) || 0,
    ssl_error: Number(s.ssl_error) || 0,
    geo_lat: typeof s.geo_lat === 'number' ? s.geo_lat : null,
    geo_long: typeof s.geo_long === 'number' ? s.geo_long : null,
    has_extended_info: Boolean(s.has_extended_info),
    lastcheckok: Number(s.lastcheckok) || 0,
  }
}

async function proxyFetch(path: string, params: Record<string, unknown>): Promise<Radio[]> {
  const qs = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')

  const url = `/api/stations?_path=${encodeURIComponent(path)}&${qs}`

  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!res.ok) return directMirrorFetch(path, qs)
  const data: Record<string, unknown>[] = await res.json()
  return data.map(sanitizeStation).filter((s): s is Radio => s !== null)
}

async function directMirrorFetch(path: string, qs: string): Promise<Radio[]> {
  let lastError: Error | null = null

  for (const mirror of DIRECT_MIRRORS) {
    try {
      const res = await fetch(`${mirror}${path}?${qs}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (!res.ok) {
        lastError = new Error(`Mirror ${mirror} returned ${res.status}`)
        continue
      }
      const data: Record<string, unknown>[] = await res.json()
      return data.map(sanitizeStation).filter((s): s is Radio => s !== null)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }

  throw lastError ?? new Error('Radio Browser API unavailable')
}

export async function fetchStations(filters: Partial<StationFilter> = {}): Promise<Radio[]> {
  const params = { ...DEFAULT_PARAMS, ...filters }
  return proxyFetch('/json/stations/search', params)
}

export async function searchStations(query: string, country?: string, tag?: string): Promise<Radio[]> {
  const params: StationFilter = { limit: 50, order: 'votes', reverse: true }
  if (query) params.name = query
  if (country) params.countrycode = country
  if (tag) params.tag = tag
  return proxyFetch('/json/stations/search', params)
}

export async function fetchStationsByUuids(uuids: string[]): Promise<Radio[]> {
  if (uuids.length === 0) return []
  return proxyFetch('/json/stations/byuuid', { uuids: uuids.join(',') })
}
