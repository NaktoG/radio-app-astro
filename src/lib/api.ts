import type { Radio, StationFilter } from './types'

const DEFAULT_PARAMS: StationFilter = {
  countrycode: 'AR',
  limit: 300,
  order: 'votes',
  reverse: true,
}

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

  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data: Record<string, unknown>[] = await res.json()
  return data.map(sanitizeStation).filter((s): s is Radio => s !== null)
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
