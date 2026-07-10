import { defineMiddleware } from 'astro/middleware'

const PROTECTED_ROUTES = ['/player', '/search', '/favorites']
const AUTH_COOKIE = 'radio_app_session'

export const onRequest = defineMiddleware((context, next) => {
  const lang = context.cookies.get('radio_lang')?.value
  context.locals.lang = lang === 'en' ? 'en' : 'es'

  const path = context.url.pathname
  const isProtected = PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
  const hasSession = context.cookies.get(AUTH_COOKIE)?.value === 'true'

  if (isProtected && !hasSession) {
    return context.redirect('/auth/login')
  }

  return next()
})
