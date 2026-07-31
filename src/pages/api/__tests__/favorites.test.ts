import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSessionUser } from '../../../lib/server/auth'
import { createSupabaseServerClient, getSupabaseAdmin } from '../../../lib/server/supabase'
import { DELETE, GET, POST } from '../favorites'

vi.mock('../../../lib/server/auth', () => ({
  getSessionUser: vi.fn(async () => ({
    userId: '00000000-0000-4000-8000-000000000001',
    nickname: 'Cookie Listener',
    acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
    favorites: [],
    preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
  })),
}))

vi.mock('../../../lib/server/supabase', () => ({
  createSupabaseServerClient: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}))

function cookies() {
  return { getAll: vi.fn(() => []), set: vi.fn(), delete: vi.fn() }
}

function apiContext(body: unknown = {}) {
  return {
    request: new Request('http://localhost/api/favorites', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    cookies: cookies(),
  }
}

function supabaseClient() {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(async () => ({ data: [{ station_uuid: 'station-a' }], error: null })),
    upsert: vi.fn(async () => ({ error: null })),
    delete: vi.fn(() => query),
    eq: vi.fn(async () => ({ error: null })),
  }

  return { from: vi.fn(() => query), query }
}

describe('favorites API route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createSupabaseServerClient).mockReturnValue(supabaseClient() as never)
  })

  it('uses the per-request Supabase SSR client for favorites reads instead of the admin client', async () => {
    const response = await GET(apiContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ success: true, favorites: ['station-a'] })
    expect(createSupabaseServerClient).toHaveBeenCalledOnce()
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('writes and deletes favorites through RLS-scoped user requests instead of the admin client', async () => {
    const addResponse = await POST(apiContext({ stationUuid: 'station-a' }))
    const removeResponse = await DELETE(apiContext({ stationUuid: 'station-a' }))

    expect(addResponse.status).toBe(200)
    expect(removeResponse.status).toBe(200)
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(2)
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('dedupes confirmed batch imports and upserts rows for the authenticated user through RLS', async () => {
    const client = supabaseClient()
    vi.mocked(createSupabaseServerClient).mockReturnValueOnce(client as never)

    const response = await POST(
      apiContext({ stationUuids: ['station-a', 'station-a', 'station-b'], confirmed: true })
    )

    expect(response.status).toBe(200)
    expect(client.query.upsert).toHaveBeenCalledWith(
      [
        { user_id: '00000000-0000-4000-8000-000000000001', station_uuid: 'station-a' },
        { user_id: '00000000-0000-4000-8000-000000000001', station_uuid: 'station-b' },
      ],
      { onConflict: 'user_id,station_uuid' }
    )
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('rejects batch imports without explicit confirmation', async () => {
    const response = await POST(apiContext({ stationUuids: ['station-a'], confirmed: false }))

    expect(response.status).toBe(400)
    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated favorites requests before creating a Supabase data client', async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null)

    const response = await GET(apiContext())

    expect(response.status).toBe(401)
    expect(createSupabaseServerClient).not.toHaveBeenCalled()
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })
})
