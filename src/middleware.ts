import { defineMiddleware } from 'astro/middleware'
import { getSessionUser } from './lib/server/auth'

const PROTECTED_ROUTES = ['/player', '/search', '/favorites']

export const onRequest = defineMiddleware(async (context, next) => {
  const lang = context.cookies.get('radio_lang')?.value
  context.locals.lang = lang === 'en' ? 'en' : 'es'

  const path = context.url.pathname
  const isProtected = PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
  const user = await getSessionUser(context.cookies)

  if (isProtected && !user) {
    return context.redirect('/auth/login')
  }

  context.locals.user = user

  return next()
})
