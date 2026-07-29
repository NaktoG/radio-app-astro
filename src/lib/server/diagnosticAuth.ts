import type { User } from '../types'

export const DIAGNOSTIC_AUTH_HEADER = 'x-radio-app-local-diagnostic-auth'
export const DIAGNOSTIC_AUTH_HEADER_VALUE = 'measure-player-route'

const DIAGNOSTIC_USER_CREATED_AT = '2026-07-29T00:00:00.000Z'

interface DiagnosticAuthContext {
  request: Request
  clientAddress?: string
  isDev: boolean
  isTest: boolean
  isProd: boolean
}

function isLoopbackHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase()

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1' ||
    normalizedHostname === '[::1]'
  )
}

function isLocalDiagnosticRequest(request: Request, clientAddress?: string): boolean {
  try {
    const { hostname } = new URL(request.url)

    if (!isLoopbackHost(hostname)) return false
    if (clientAddress !== undefined && !isLoopbackHost(clientAddress)) return false

    return true
  } catch {
    return false
  }
}

export function getLocalDiagnosticUser({
  request,
  clientAddress,
  isDev,
  isTest,
  isProd,
}: DiagnosticAuthContext): User | null {
  if (isProd || (!isDev && !isTest)) return null
  if (request.headers.get(DIAGNOSTIC_AUTH_HEADER) !== DIAGNOSTIC_AUTH_HEADER_VALUE) return null
  if (!isLocalDiagnosticRequest(request, clientAddress)) return null

  return {
    id: 'local-diagnostic-user',
    username: 'diagnostic_user',
    role: 'diagnostic',
    createdAt: new Date(DIAGNOSTIC_USER_CREATED_AT),
    favorites: [],
    preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
  }
}
