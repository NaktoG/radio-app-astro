import { describe, expect, it } from 'vitest'
import { resolveAuthRedirect } from '../middleware'

const profile = {
  userId: '00000000-0000-4000-8000-000000000001',
  nickname: 'Cookie Listener',
  acceptedAnonymousRiskAt: '2026-07-30T12:00:00.000Z',
  favorites: [],
  preferences: { theme: 'dark' as const, defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
}

describe('profile-gated routes', () => {
  it('redirects direct /player access to profile setup when no complete profile is restored', () => {
    expect(resolveAuthRedirect('/player', null)).toBe('/auth/profile')
    expect(resolveAuthRedirect('/player/live', null)).toBe('/auth/profile')
  })

  it('keeps /search public and allows /player when a complete profile exists', () => {
    expect(resolveAuthRedirect('/search', null)).toBeNull()
    expect(resolveAuthRedirect('/search/countries', null)).toBeNull()
    expect(resolveAuthRedirect('/player', profile)).toBeNull()
  })
})
