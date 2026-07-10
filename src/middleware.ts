import { defineMiddleware } from 'astro/middleware'

export const onRequest = defineMiddleware((context, next) => {
  const lang = context.cookies.get('radio_lang')?.value
  context.locals.lang = lang === 'en' ? 'en' : 'es'
  return next()
})
