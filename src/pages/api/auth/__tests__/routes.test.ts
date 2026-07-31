import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAnonymousProfileForRequest, getSessionUser } from '../../../../lib/server/auth'
import { POST as createAnonymous } from '../anonymous'
import { POST as legacyLogin } from '../login'
import { POST as legacyRegister } from '../register'
import { GET as getMe } from '../me'
import { POST as logout } from '../logout'

vi.mock('../../../../lib/server/auth', () => ({
  DUPLICATE_NICKNAME_MESSAGE: 'Nickname is already taken. Choose another display nickname.',
  createAnonymousProfileForRequest: vi.fn(async () => ({
    userId: '00000000-0000-4000-8000-000000000001',
    nickname: 'Route Listener',
    acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
    favorites: [],
    preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
  })),
  getSessionUser: vi.fn(async () => ({
    userId: '00000000-0000-4000-8000-000000000001',
    nickname: 'Cookie Listener',
    acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
    favorites: [],
    preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
  })),
  signOutRequest: vi.fn(async () => undefined),
}))

function apiContext(body: unknown = {}) {
  return {
    request: new Request('http://localhost/api/auth/anonymous', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    cookies: { getAll: vi.fn(() => []), set: vi.fn(), delete: vi.fn() },
  }
}

describe('anonymous auth API routes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates anonymous profiles through the server-owned endpoint', async () => {
    const response = await createAnonymous(
      apiContext({ nickname: 'Route Listener', acceptedAnonymousRisk: true })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      user: {
        userId: '00000000-0000-4000-8000-000000000001',
        nickname: 'Route Listener',
        acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
        favorites: [],
        preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
      },
      message: 'Anonymous profile created.',
    })
  })

  it('rejects unaccepted anonymous-risk profile creation attempts', async () => {
    vi.mocked(createAnonymousProfileForRequest).mockRejectedValueOnce(
      new Error('Anonymous risk acceptance is required')
    )

    const response = await createAnonymous(
      apiContext({ nickname: 'Route Listener', acceptedAnonymousRisk: false })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      success: false,
      message: 'Anonymous risk acceptance is required',
    })
  })

  it('returns conflict copy for duplicate display nicknames without credential semantics', async () => {
    vi.mocked(createAnonymousProfileForRequest).mockRejectedValueOnce(
      new Error('Nickname is already taken. Choose another display nickname.')
    )

    const response = await createAnonymous(
      apiContext({ nickname: 'Route Listener', acceptedAnonymousRisk: true })
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      success: false,
      message: 'Nickname is already taken. Choose another display nickname.',
    })
  })

  it('reports restored session profile state from /me and missing profiles as unauthorized', async () => {
    const success = await getMe(apiContext())
    const successPayload = await success.json()

    expect(success.status).toBe(200)
    expect(successPayload.user.nickname).toBe('Cookie Listener')

    vi.mocked(getSessionUser).mockResolvedValueOnce(null)
    const missingProfile = await getMe(apiContext())

    expect(missingProfile.status).toBe(401)
    expect(await missingProfile.json()).toEqual({
      success: false,
      user: null,
      message: 'Anonymous session or profile is required.',
    })
  })

  it('does not expose nickname/password credential login or registration', async () => {
    const loginResponse = await legacyLogin(
      apiContext({ username: 'Radio Fan', password: 'password123' })
    )
    const registerResponse = await legacyRegister(
      apiContext({ username: 'Radio Fan', password: 'password123' })
    )

    expect(loginResponse.status).toBe(410)
    expect(await loginResponse.json()).toEqual({
      success: false,
      message: 'Password login has been replaced by anonymous profiles.',
    })
    expect(registerResponse.status).toBe(410)
    expect(await registerResponse.json()).toEqual({
      success: false,
      message: 'Password registration has been replaced by anonymous profiles.',
    })
  })

  it('logs out through Supabase SSR auth with anonymous-account recovery messaging', async () => {
    const response = await logout(apiContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      success: true,
      message: 'Anonymous session closed. Anonymous accounts may not be recoverable after logout.',
    })
  })
})
