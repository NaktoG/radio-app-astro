import type { APIRoute } from 'astro'

const CACHE_MAX_AGE = 86400
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

function isInternalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.startsWith('127.') ||
    lower.startsWith('10.') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('169.254.') ||
    lower.startsWith('172.16.') ||
    lower.startsWith('172.17.') ||
    lower.startsWith('172.18.') ||
    lower.startsWith('172.19.') ||
    lower.startsWith('172.20.') ||
    lower.startsWith('172.21.') ||
    lower.startsWith('172.22.') ||
    lower.startsWith('172.23.') ||
    lower.startsWith('172.24.') ||
    lower.startsWith('172.25.') ||
    lower.startsWith('172.26.') ||
    lower.startsWith('172.27.') ||
    lower.startsWith('172.28.') ||
    lower.startsWith('172.29.') ||
    lower.startsWith('172.30.') ||
    lower.startsWith('172.31.') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  )
}

export const GET: APIRoute = async ({ url }) => {
  const imageUrl = url.searchParams.get('url')
  if (!imageUrl) return new Response('Missing url parameter', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return new Response('Invalid protocol', { status: 400 })
  }

  // H-04: Bloquear SSRF a redes internas
  if (isInternalHost(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403 })
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadioApp/1.0)',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return new Response(null, { status: 204 })

    // H-10: Limitar tamaño de respuesta
    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > MAX_IMAGE_SIZE) return new Response(null, { status: 204 })

    const contentType = response.headers.get('content-type') || ''

    // Solo permitir imágenes reales (no application/octet-stream)
    if (!contentType.startsWith('image/')) {
      return new Response(null, { status: 204 })
    }

    const buffer = await response.arrayBuffer()

    // Doble check: si el buffer real es más grande que el header
    if (buffer.byteLength > MAX_IMAGE_SIZE) return new Response(null, { status: 204 })

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response(null, { status: 204 })
  }
}
