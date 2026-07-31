import type { APIRoute } from 'astro'
import { signOutRequest } from '../../../lib/server/auth'

export const POST: APIRoute = async ({ cookies }) => {
  await signOutRequest(cookies)
  return Response.json({
    success: true,
    message: 'Anonymous session closed. Anonymous accounts may not be recoverable after logout.',
  })
}
