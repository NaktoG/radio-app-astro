import type { Radio } from '../types'

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
function httpUrl(value: unknown): string {
  const candidate = text(value)
  try {
    const url = new URL(candidate)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}
export function normalizeStation(value: unknown): Radio | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const s = value as Record<string, unknown>
  const name = text(s.name),
    stationuuid = text(s.stationuuid)
  const url = httpUrl(s.url),
    url_resolved = httpUrl(s.url_resolved)
  if (!name || !stationuuid || (!url && !url_resolved)) return null
  return {
    name,
    stationuuid,
    url,
    url_resolved,
    changeuuid: text(s.changeuuid),
    homepage: httpUrl(s.homepage),
    favicon: httpUrl(s.favicon),
    tags: text(s.tags),
    country: text(s.country),
    countrycode: text(s.countrycode),
    state: text(s.state),
    language: text(s.language),
    languagecodes: text(s.languagecodes),
    codec: text(s.codec),
    votes: number(s.votes),
    bitrate: number(s.bitrate),
    clickcount: number(s.clickcount),
    clicktrend: number(s.clicktrend),
    ssl_error: number(s.ssl_error),
    geo_lat: typeof s.geo_lat === 'number' ? s.geo_lat : null,
    geo_long: typeof s.geo_long === 'number' ? s.geo_long : null,
    has_extended_info: s.has_extended_info === true,
    lastcheckok: number(s.lastcheckok),
  }
}
export function normalizeStations(payload: unknown): Radio[] {
  if (!Array.isArray(payload)) throw new Error('Invalid station directory response')
  const stations = payload
    .map(normalizeStation)
    .filter((station): station is Radio => station !== null)
  if (payload.length > 0 && stations.length === 0) throw new Error('Invalid station records')
  return [...new Map(stations.map((station) => [station.stationuuid, station])).values()]
}
