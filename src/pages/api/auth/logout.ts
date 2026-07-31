import type { APIRoute } from 'astro'
import { signOutRequest } from '../../../lib/server/auth'

export const POST: APIRoute = async ({ request, cookies }) => {
  await signOutRequest(cookies, request)
  return Response.json({
    success: true,
    message: 'Anonymous session closed. Anonymous accounts may not be recoverable after logout.',
  })
}
