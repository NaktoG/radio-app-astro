import type { APIRoute } from 'astro'
import { getSessionUser } from '../../../lib/server/auth'

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies, request)
  if (!user) {
    return Response.json(
      { success: false, user: null, message: 'Anonymous session or profile is required.' },
      { status: 401 }
    )
  }
  return Response.json({ success: true, user, message: 'Anonymous profile restored.' })
}
