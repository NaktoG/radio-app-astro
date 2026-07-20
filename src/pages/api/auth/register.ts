import type { APIRoute } from 'astro'
import { registerUser, setSessionCookie } from '../../../lib/server/auth'

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json()
    if (body.password !== body.confirmPassword) {
      return Response.json({ success: false, message: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    const { user, token } = await registerUser(String(body.username ?? ''), String(body.password ?? ''))
    setSessionCookie(cookies, token)
    return Response.json({ success: true, user, message: '¡Registro exitoso!' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo crear la cuenta'
    return Response.json({ success: false, message }, { status: 400 })
  }
}
