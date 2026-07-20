import type { APIRoute } from 'astro'
import { clearSessionCookie, deleteSession } from '../../../lib/server/auth'

export const POST: APIRoute = async ({ cookies }) => {
  await deleteSession(cookies)
  clearSessionCookie(cookies)
  return Response.json({ success: true, message: 'Sesión cerrada' })
}
