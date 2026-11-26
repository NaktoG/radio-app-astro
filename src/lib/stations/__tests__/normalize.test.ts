import { describe, expect, it } from 'vitest'
import { normalizeStations } from '../normalize'
import { TimedCache } from '../cache'
describe('station validation and cache', () => {
  it('rejects invalid payload shapes and unsafe stream URLs', () => {
    expect(() => normalizeStations(null)).toThrow()
    expect(() => normalizeStations([{stationuuid:'x',name:'Bad',url:'javascript:alert(1)'}])).toThrow()
    expect(normalizeStations([])).toEqual([])
  })
  it('filters invalid entries and deduplicates UUIDs', () => {
    const good = {stationuuid:'x',name:' Radio ',url:'https://example.com/live'}
    expect(normalizeStations([null,good,good])).toHaveLength(1)
    expect(normalizeStations([good])[0].name).toBe('Radio')
  })
  it('evicts the oldest entry at capacity and respects age limits', () => {
    let now = 0
    const cache = new TimedCache<number>(2,()=>now)
    cache.set('a',1);cache.set('b',2);cache.set('c',3)
    expect(cache.get('a',100)).toBeUndefined()
    expect(cache.get('b',100)).toBe(2)
    now=100
    expect(cache.get('b',100)).toBeUndefined()
  })
})
