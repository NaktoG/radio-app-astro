import { describe, expect, it, vi } from 'vitest'
import {
  createAnonymousProfile,
  getSessionProfile,
  signOut,
  type AuthSupabaseClient,
} from '../auth'

function profileRow(nickname: string, userId = '00000000-0000-4000-8000-000000000001') {
  return {
    user_id: userId,
    nickname,
    accepted_anonymous_risk_at: '2026-07-30T12:00:00.000Z',
  }
}

function userClient(overrides: Partial<AuthSupabaseClient> = {}): AuthSupabaseClient {
  const client: AuthSupabaseClient = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      signInAnonymously: vi.fn(async () => ({
        data: { user: { id: '00000000-0000-4000-8000-000000000001', is_anonymous: true } },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: profileRow('Cookie Listener'), error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: profileRow('Radio Fan'), error: null })),
        })),
      })),
    })),
  }

  return { ...client, ...overrides }
}

function profileCreationClient(userId: string, nickname: string): AuthSupabaseClient {
  return userClient({
    auth: {
      getUser: vi.fn(),
      signInAnonymously: vi.fn(async () => ({
        data: { user: { id: userId, is_anonymous: true } },
        error: null,
      })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: profileRow(nickname, userId), error: null })),
        })),
      })),
    })),
  })
}

function duplicateNicknameClient(userId: string): AuthSupabaseClient {
  return userClient({
    auth: {
      getUser: vi.fn(),
      signInAnonymously: vi.fn(async () => ({
        data: { user: { id: userId, is_anonymous: true } },
        error: null,
      })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: null,
            error: {
              code: '23505',
              message:
                'duplicate key value violates unique constraint "profiles_nickname_normalized_key"',
            },
          })),
        })),
      })),
    })),
  })
}

describe('Supabase anonymous auth plumbing', () => {
  it('restores a complete anonymous profile from the request Supabase session', async () => {
    const client = userClient({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: '00000000-0000-4000-8000-000000000001', is_anonymous: true } },
          error: null,
        })),
        signInAnonymously: vi.fn(),
        signOut: vi.fn(),
      },
    })

    const result = await getSessionProfile(client)

    expect(result).toEqual({
      userId: '00000000-0000-4000-8000-000000000001',
      nickname: 'Cookie Listener',
      acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
      favorites: [],
      preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
    })
  })

  it('returns null when a request has no Supabase session or no matching profile', async () => {
    const missingSession = await getSessionProfile(userClient())

    const missingProfile = await getSessionProfile(
      userClient({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: '00000000-0000-4000-8000-000000000001', is_anonymous: true } },
            error: null,
          })),
          signInAnonymously: vi.fn(),
          signOut: vi.fn(),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({ data: null, error: { code: 'PGRST116' } })),
            })),
          })),
          insert: vi.fn(),
        })),
      })
    )

    expect(missingSession).toBeNull()
    expect(missingProfile).toBeNull()
  })

  it('treats unavailable request Supabase configuration as no restored profile', async () => {
    await expect(
      getSessionProfile({
        auth: {
          getUser: vi.fn(async () => {
            throw new Error('Missing required environment variable: SUPABASE_URL')
          }),
          signInAnonymously: vi.fn(),
          signOut: vi.fn(),
        },
        from: vi.fn(),
      })
    ).resolves.toBeNull()
  })

  it('creates a server-owned anonymous Supabase session and profile only after risk acceptance', async () => {
    const client = userClient()

    const result = await createAnonymousProfile(client, {
      nickname: '  Radio Fan  ',
      acceptedAnonymousRisk: true,
    })

    expect(result.nickname).toBe('Radio Fan')
    expect(client.auth.signInAnonymously).toHaveBeenCalledOnce()
    expect(client.from).toHaveBeenCalledWith('profiles')

    await expect(
      createAnonymousProfile(client, { nickname: 'Radio Fan', acceptedAnonymousRisk: false })
    ).rejects.toThrow('Anonymous risk acceptance is required')
  })

  it('rejects trim and case equivalent duplicate display nicknames for different auth user ids', async () => {
    const first = await createAnonymousProfile(
      profileCreationClient('00000000-0000-4000-8000-000000000001', 'Same Nickname'),
      { nickname: ' Same Nickname ', acceptedAnonymousRisk: true }
    )

    expect(first.nickname).toBe('Same Nickname')
    await expect(
      createAnonymousProfile(duplicateNicknameClient('00000000-0000-4000-8000-000000000002'), {
        nickname: 'same nickname',
        acceptedAnonymousRisk: true,
      })
    ).rejects.toThrow('Nickname is already taken. Choose another display nickname.')
  })

  it('signs out through the Supabase SSR client instead of deleting custom session rows', async () => {
    const client = userClient()

    await signOut(client)

    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })
})
