import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getIsAuthenticated, initAuth, login, logout, register } from '../auth'

describe('auth persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('updates auth state from server responses', async () => {
    const user = {
      id: 'usr_1',
      username: 'radio_user',
      role: 'user',
      createdAt: new Date(),
      favorites: [],
      preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url === '/api/auth/me') {
        return new Response(JSON.stringify({ success: false, user: null }), { status: 401 })
      }
      if (url === '/api/auth/register' || url === '/api/auth/login') {
        return Response.json({ success: true, user, message: 'ok' })
      }
      if (url === '/api/auth/logout') {
        return Response.json({ success: true, message: 'ok' })
      }
      return Response.json({ success: false, message: 'not found' }, { status: 404 })
    })

    const created = await register({
      username: 'radio_user',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(created.success).toBe(true)
    expect(getIsAuthenticated()).toBe(true)

    await logout()
    await initAuth()

    expect(getIsAuthenticated()).toBe(false)

    const loggedIn = await login({ username: 'radio_user', password: 'password123' })

    expect(loggedIn.success).toBe(true)
    expect(getIsAuthenticated()).toBe(true)
  })
})
