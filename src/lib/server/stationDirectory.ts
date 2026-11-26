import type { Radio } from '../types'
import { TimedCache } from '../stations/cache'
import { normalizeStations } from '../stations/normalize'

export interface DirectoryResult {
  stations: Radio[]
  source: 'network' | 'cache' | 'stale'
}
export class DirectoryUnavailable extends Error {
  constructor() {
    super('Station directory temporarily unavailable')
    this.name = 'DirectoryUnavailable'
  }
}
const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://all.api.radio-browser.info',
] as const
const FRESH_MS = 5 * 60_000
const STALE_MS = 60 * 60_000
const TIMEOUT_MS = 3_000
const COOLDOWN_MS = 20_000

/** Transport, resilience and caching; HTTP routing lives in pages/api/stations. */
export function createStationDirectory(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now
) {
  const cache = new TimedCache<Radio[]>(128, now)
  const pending = new Map<string, Promise<DirectoryResult>>()
  const blockedUntil = new Map<string, number>()
  let preferred: string = MIRRORS[0]
  async function fetchFromMirrors(key: string): Promise<DirectoryResult> {
    const mirrors = [...MIRRORS].sort((a, b) => Number(b === preferred) - Number(a === preferred))
    for (const mirror of mirrors) {
      if ((blockedUntil.get(mirror) || 0) > now()) continue
      try {
        const response = await fetcher(`${mirror}${key}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'RadioApp/4.0 (+https://github.com/NaktoG/radio-app-astro)',
          },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!response.ok) throw new DirectoryUnavailable()
        const payload: unknown = await response.json()
        const stations = normalizeStations(payload)
        cache.set(key, stations)
        preferred = mirror
        return { stations, source: 'network' }
      } catch {
        blockedUntil.set(mirror, now() + COOLDOWN_MS)
      }
    }
    const stale = cache.get(key, STALE_MS)
    if (stale !== undefined) return { stations: stale, source: 'stale' }
    throw new DirectoryUnavailable()
  }
  return {
    async get(path: string, params: URLSearchParams): Promise<DirectoryResult> {
      params.sort()
      const key = `${path}?${params}`
      const cached = cache.get(key, FRESH_MS)
      if (cached !== undefined) return { stations: cached, source: 'cache' }
      const existing = pending.get(key)
      if (existing) return existing
      if (pending.size >= 64) throw new DirectoryUnavailable()
      const request = fetchFromMirrors(key).finally(() => pending.delete(key))
      pending.set(key, request)
      return request
    },
  }
}
export const stationDirectory = createStationDirectory()
