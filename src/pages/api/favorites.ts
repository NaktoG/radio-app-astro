import type { APIRoute } from 'astro'
import { getSessionUser } from '../../lib/server/auth'
import { getSupabaseAdmin } from '../../lib/server/supabase'

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies)
  if (!user) return Response.json({ success: false, favorites: [] }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('favorite_stations')
    .select('station_uuid')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ success: false, favorites: [] }, { status: 500 })
  return Response.json({ success: true, favorites: data.map((item) => item.station_uuid) })
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies)
  if (!user) return Response.json({ success: false, message: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const stationUuid = String(body.stationUuid ?? '').trim()
  if (!stationUuid) return Response.json({ success: false, message: 'stationUuid requerido' }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from('favorite_stations')
    .upsert({ user_id: user.id, station_uuid: stationUuid }, { onConflict: 'user_id,station_uuid' })

  if (error) return Response.json({ success: false, message: 'No se pudo guardar el favorito' }, { status: 500 })
  return Response.json({ success: true })
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies)
  if (!user) return Response.json({ success: false, message: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const stationUuid = String(body.stationUuid ?? '').trim()
  if (!stationUuid) return Response.json({ success: false, message: 'stationUuid requerido' }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from('favorite_stations')
    .delete()
    .eq('user_id', user.id)
    .eq('station_uuid', stationUuid)

  if (error) return Response.json({ success: false, message: 'No se pudo eliminar el favorito' }, { status: 500 })
  return Response.json({ success: true })
}
