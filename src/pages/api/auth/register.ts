import type { APIRoute } from 'astro'

export const POST: APIRoute = async () => {
  return Response.json(
    { success: false, message: 'Password registration has been replaced by anonymous profiles.' },
    { status: 410 }
  )
}
