import { defineMiddleware } from 'astro/middleware'
import { getLocalDiagnosticUser } from './lib/server/diagnosticAuth'
import { getSessionUser } from './lib/server/auth'
import type { User } from './lib/types'

const PROFILE_GATED_ROUTES = ['/player']

function matchesRoute(path: string, route: string) {
  return path === route || path.startsWith(`${route}/`)
}

export function resolveAuthRedirect(path: string, user: User | null): string | null {
  const requiresProfile = PROFILE_GATED_ROUTES.some((route) => matchesRoute(path, route))
  if (requiresProfile && !user) return '/auth/profile'
  return null
}

function getOptionalClientAddress(context: Parameters<Parameters<typeof defineMiddleware>[0]>[0]) {
  try {
    return context.clientAddress
  } catch {
    return undefined
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const lang = context.cookies.get('radio_lang')?.value
  context.locals.lang = lang === 'en' ? 'en' : 'es'

  const path = context.url.pathname
  // Public directory/image responses must not depend on Supabase availability
  // or refresh a user cookie before entering a shared CDN cache.
  if (path === '/api/stations' || path === '/api/image-proxy' || path === '/_image') {
    context.locals.user = null
    return next()
  }
  const user =
    getLocalDiagnosticUser({
      request: context.request,
      clientAddress: getOptionalClientAddress(context),
      isDev: import.meta.env.DEV,
      isTest: import.meta.env.MODE === 'test',
      isProd: import.meta.env.PROD,
    }) ?? (await getSessionUser(context.cookies, context.request))

  const redirectTo = resolveAuthRedirect(path, user)
  if (redirectTo) {
    return context.redirect(redirectTo)
  }

  context.locals.user = user

  return next()
})
