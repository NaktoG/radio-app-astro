import { beforeEach, describe, expect, it } from 'vitest'
import { getIsAuthenticated, initAuth, login, logout, register } from '../auth'

describe('auth persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps the registered local account after logout so the user can log in again', async () => {
    const created = await register({
      username: 'radio_user',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(created.success).toBe(true)
    expect(getIsAuthenticated()).toBe(true)

    logout()
    initAuth()

    expect(getIsAuthenticated()).toBe(false)

    const loggedIn = await login({ username: 'radio_user', password: 'password123' })

    expect(loggedIn.success).toBe(true)
    expect(getIsAuthenticated()).toBe(true)
  })
})
