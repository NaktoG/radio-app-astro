import type { APIRoute } from 'astro'
import { getSessionUser } from '../../lib/server/auth'
import { createSupabaseServerClient } from '../../lib/server/supabase'

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies, request)
  if (!user) return Response.json({ success: false, favorites: [] }, { status: 401 })

  const { data, error } = await createSupabaseServerClient(cookies, request)
    .from('favorite_stations')
    .select('station_uuid')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ success: false, favorites: [] }, { status: 500 })
  return Response.json({ success: true, favorites: data.map((item) => item.station_uuid) })
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies, request)
  if (!user) return Response.json({ success: false, message: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  if (Array.isArray(body.stationUuids)) {
    if (body.confirmed !== true) {
      return Response.json({ success: false, message: 'Importación no confirmada' }, { status: 400 })
    }

    const stationUuids = dedupeStationUuids(body.stationUuids)
    if (stationUuids.length === 0) {
      return Response.json({ success: false, message: 'stationUuids requerido' }, { status: 400 })
    }

    const { error } = await createSupabaseServerClient(cookies, request)
      .from('favorite_stations')
      .upsert(
        stationUuids.map((stationUuid) => ({ user_id: user.userId, station_uuid: stationUuid })),
        { onConflict: 'user_id,station_uuid' }
      )

    if (error) return Response.json({ success: false, message: 'No se pudo importar favoritos' }, { status: 500 })
    return Response.json({ success: true })
  }

  const stationUuid = String(body.stationUuid ?? '').trim()
  if (!stationUuid) return Response.json({ success: false, message: 'stationUuid requerido' }, { status: 400 })

  const { error } = await createSupabaseServerClient(cookies, request)
    .from('favorite_stations')
    .upsert({ user_id: user.userId, station_uuid: stationUuid }, { onConflict: 'user_id,station_uuid' })

  if (error) return Response.json({ success: false, message: 'No se pudo guardar el favorito' }, { status: 500 })
  return Response.json({ success: true })
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies, request)
  if (!user) return Response.json({ success: false, message: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const stationUuid = String(body.stationUuid ?? '').trim()
  if (!stationUuid) return Response.json({ success: false, message: 'stationUuid requerido' }, { status: 400 })

  const { error } = await createSupabaseServerClient(cookies, request)
    .from('favorite_stations')
    .delete()
    .eq('station_uuid', stationUuid)

  if (error) return Response.json({ success: false, message: 'No se pudo eliminar el favorito' }, { status: 500 })
  return Response.json({ success: true })
}

function dedupeStationUuids(stationUuids: unknown[]): string[] {
  return [...new Set(stationUuids.map((stationUuid) => String(stationUuid).trim()).filter(Boolean))]
}
