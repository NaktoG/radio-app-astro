import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

describe('anonymous auth security readiness contracts', () => {
  it('keeps favorites scoped to the restored auth.uid user and rejects client-supplied user ids', () => {
    const route = read('src/pages/api/favorites.ts')

    expect(route).toContain('getSessionUser(cookies, request)')
    expect(route).toContain('user_id: user.userId')
    expect(route).not.toMatch(/body\.userId|body\.user_id|requestUserId|clientUserId/)
    expect(route).not.toContain('getSupabaseAdmin')
  })

  it('keeps profile and favorite RLS based on auth.uid rather than nickname credentials', () => {
    const sql = read('docs/supabase-setup.sql').toLowerCase()
    const policyStatements = sql.match(/create policy[\s\S]*?;/g) ?? []

    expect(policyStatements.length).toBeGreaterThan(0)
    expect(policyStatements.every((policy) => policy.includes('auth.uid()'))).toBe(true)
    expect(policyStatements.every((policy) => !policy.includes('nickname'))).toBe(true)
    expect(sql).toContain('lower(btrim(nickname))')
  })

  it('does not use browser storage for anonymous auth, profile, or Supabase-backed favorites', () => {
    const authClient = read('src/lib/auth.ts')
    const favoritesStore = read('src/stores/favorites.ts')
    const supabaseServer = read('src/lib/server/supabase.ts')

    expect(authClient).not.toMatch(/localStorage|sessionStorage/)
    expect(favoritesStore).not.toMatch(/localStorage|sessionStorage|radio_favorites/)
    expect(supabaseServer).toContain('persistSession: false')
  })

  it('documents Vercel readiness without requiring service-role credentials for user auth paths', () => {
    const readiness = read('docs/ANONYMOUS_AUTH_VERCEL_READINESS.md')

    expect(readiness).toContain('SUPABASE_URL')
    expect(readiness).toContain('SUPABASE_ANON_KEY')
    expect(readiness).toContain('Node.js 22.x')
    expect(readiness).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY.*required for auth/i)
  })
})
