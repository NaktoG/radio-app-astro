import type { APIRoute } from 'astro'
import {
  DUPLICATE_NICKNAME_MESSAGE,
  createAnonymousProfileForRequest,
} from '../../../lib/server/auth'

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json()
    const user = await createAnonymousProfileForRequest(cookies, {
      nickname: String(body.nickname ?? ''),
      acceptedAnonymousRisk: body.acceptedAnonymousRisk === true,
    }, request)

    return Response.json({ success: true, user, message: 'Anonymous profile created.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create anonymous profile'
    const status = message === DUPLICATE_NICKNAME_MESSAGE ? 409 : 400
    return Response.json({ success: false, message }, { status })
  }
}
