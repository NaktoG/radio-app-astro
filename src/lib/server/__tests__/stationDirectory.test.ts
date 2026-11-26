import { describe, expect, it, vi } from 'vitest'
import { createStationDirectory } from '../stationDirectory'
const station = { stationuuid: 'r1', name: 'Radio Uno', url: 'https://example.com/live' }
const params = () => new URLSearchParams({ limit: '36' })

describe('station directory resilience', () => {
  it('fails over, validates data and reuses cached responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(Response.json([station]))
    const directory = createStationDirectory(fetcher)
    expect((await directory.get('/json/stations/search', params())).stations[0].name).toBe('Radio Uno')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect((await directory.get('/json/stations/search', params())).source).toBe('cache')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('coalesces simultaneous requests for the same search', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json([station]))
    const directory = createStationDirectory(fetcher)
    const results = await Promise.all([directory.get('/json/stations/search', params()), directory.get('/json/stations/search', params())])
    expect(fetcher).toHaveBeenCalledOnce()
    expect(results[0]).toEqual(results[1])
  })
  it('uses last-known results during an outage, then expires them', async () => {
    let now = 0
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([station]))
    const directory = createStationDirectory(fetcher, () => now)
    await directory.get('/json/stations/search', params())
    now = 6 * 60_000
    fetcher.mockRejectedValue(new Error('offline'))
    expect((await directory.get('/json/stations/search', params())).source).toBe('stale')
    now = 61 * 60_000
    await expect(directory.get('/json/stations/search', params())).rejects.toThrow('temporarily unavailable')
  })
  it('rejects malformed upstream payloads and avoids hammering failed hosts', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ error: 'invalid' }))
    const directory = createStationDirectory(fetcher, () => 100)
    await expect(directory.get('/json/stations/search', params())).rejects.toThrow()
    await expect(directory.get('/json/stations/search', new URLSearchParams({name:'Other'}))).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
