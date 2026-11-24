import type { APIRoute } from 'astro'

// Legacy clients use this route for station artwork. Serve a bundled image
// so the server never opens a connection to a user-supplied destination.
export const GET: APIRoute = () => new Response(null, {
  status: 302,
  headers: { Location: '/pwa-icon.svg', 'Cache-Control': 'public, max-age=3600' },
})
