import type { APIRoute } from 'astro'
import { getSessionUser } from '../../../lib/server/auth'

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies)
  if (!user) return Response.json({ success: false, user: null }, { status: 401 })
  return Response.json({ success: true, user })
}
