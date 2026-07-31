import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

function requiredEnv(
  name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY'
): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getSupabaseAdmin() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function parseCookiesFromHeader(request: Request): { name: string; value: string }[] {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return []
  return cookieHeader.split(';').map((pair) => {
    const idx = pair.indexOf('=')
    if (idx === -1) return { name: pair.trim(), value: '' }
    return { name: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() }
  })
}

export function createSupabaseServerClient(cookies: AstroCookies, request?: Request) {
  const allCookies = request ? parseCookiesFromHeader(request) : []

  return createServerClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_ANON_KEY'), {
    cookies: {
      getAll() {
        return allCookies
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: options.path ?? '/' })
        })
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
