// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

function worker(enabled: boolean, fetcher: typeof fetch, cached?: Response, denyStorage = false) {
  const handlers = new Map<string, (event: { request?: Request; respondWith: (response: Promise<Response>) => void; waitUntil: (promise: Promise<unknown>) => void }) => void>()
  const put = vi.fn()
  const context = {
    self: { location: new URL(`https://radio.test/sw.js${enabled ? '?cache=1' : ''}`), Response, skipWaiting: vi.fn(), clients: { claim: vi.fn() }, addEventListener: (name: string, fn: (typeof handlers extends Map<string,infer V> ? V : never)) => handlers.set(name, fn) },
    URL, fetch: fetcher,
    caches: { match: vi.fn(async () => { if (denyStorage) throw new Error('denied'); return cached }), open: vi.fn(async () => { if (denyStorage) throw new Error('denied'); return { put } }), keys: vi.fn(async () => []), delete: vi.fn() },
  }
  runInNewContext(readFileSync('public/sw.js','utf8'),context)
  async function request(path: string, mode = 'cors') {
    let result: Promise<Response> | undefined
    handlers.get('fetch')?.({ request: { url: `https://radio.test${path}`, method:'GET', headers:new Headers(), destination:'script', mode } as Request, respondWith: (promise) => {result=promise}, waitUntil: () => {} })
    return result ? await result : undefined
  }
  return { request, put }
}
describe('service worker regressions', () => {
  it('returns a real Response on an uncached network failure', async () => {
    const result = await worker(true, vi.fn().mockRejectedValue(new Error('offline'))).request('/_astro/app.js')
    expect(result).toBeInstanceOf(Response)
    expect(result?.status).toBe(503)
  })
  it('does not intercept preview assets, authentication or API requests', async () => {
    const fetcher = vi.fn()
    expect(await worker(false, fetcher).request('/manifest.webmanifest')).toBeUndefined()
    expect(await worker(true, fetcher).request('/api/stations')).toBeUndefined()
    expect(await worker(true, fetcher).request('/auth/profile','navigate')).toBeUndefined()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('keeps the network usable when cache storage is denied', async () => {
    const result = await worker(true,vi.fn().mockResolvedValue(new Response('ok')),undefined,true).request('/_astro/app.js')
    expect(await result?.text()).toBe('ok')
  })
  it('serves the offline page for failed navigation without caching profiles', async () => {
    const result = await worker(true,vi.fn().mockRejectedValue(new Error('offline')),new Response('offline page')).request('/player','navigate')
    expect(await result?.text()).toBe('offline page')
  })
  it('does not cache redirected sign-in responses', async () => {
    const redirected = new Response('sign in')
    Object.defineProperty(redirected,'redirected',{value:true})
    const fixture = worker(true,vi.fn().mockResolvedValue(redirected))
    await fixture.request('/_astro/app.js')
    expect(fixture.put).not.toHaveBeenCalled()
  })
})
