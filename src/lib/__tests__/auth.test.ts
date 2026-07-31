import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAnonymousProfile,
  getCurrentUser,
  getIsAuthenticated,
  initAuth,
  logout,
} from '../auth'

describe('auth persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('updates auth state from server-owned anonymous profile responses without localStorage', async () => {
    const user = {
      userId: '00000000-0000-4000-8000-000000000001',
      nickname: 'Radio Fan',
      acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
      favorites: [],
      preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
    }
    const writtenPayloads: unknown[] = []
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url === '/api/auth/me') {
        return new Response(JSON.stringify({ success: false, user: null }), { status: 401 })
      }
      if (url === '/api/auth/anonymous') {
        writtenPayloads.push(JSON.parse(String(init?.body ?? '{}')))
        return Response.json({ success: true, user, message: 'ok' })
      }
      if (url === '/api/auth/logout') {
        return Response.json({ success: true, message: 'ok' })
      }
      return Response.json({ success: false, message: 'not found' }, { status: 404 })
    })

    const created = await createAnonymousProfile({
      nickname: 'Radio Fan',
      acceptedAnonymousRisk: true,
    })

    expect(created.success).toBe(true)
    expect(getIsAuthenticated()).toBe(true)
    expect(getCurrentUser()?.nickname).toBe('Radio Fan')
    expect(writtenPayloads).toEqual([{ nickname: 'Radio Fan', acceptedAnonymousRisk: true }])
    expect(setItemSpy).not.toHaveBeenCalled()

    await logout()
    await initAuth()

    expect(getIsAuthenticated()).toBe(false)
    expect(localStorage.length).toBe(0)
  })
})
