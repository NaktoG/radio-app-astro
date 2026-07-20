import type { APIRoute } from 'astro'
import { loginUser, setSessionCookie } from '../../../lib/server/auth'

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json()
    const { user, token } = await loginUser(String(body.username ?? ''), String(body.password ?? ''))
    setSessionCookie(cookies, token)
    return Response.json({ success: true, user, message: '¡Inicio de sesión exitoso!' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Credenciales inválidas'
    return Response.json({ success: false, message }, { status: 401 })
  }
}
