import { describe, expect, it } from 'vitest'
import {
  DIAGNOSTIC_AUTH_HEADER,
  DIAGNOSTIC_AUTH_HEADER_VALUE,
  getLocalDiagnosticUser,
} from '../diagnosticAuth'

function requestWithHeader(value: string | null, url = 'http://localhost/player'): Request {
  const headers = new Headers()
  if (value !== null) headers.set(DIAGNOSTIC_AUTH_HEADER, value)
  return new Request(url, { headers })
}

function invalidUrlRequestWithHeader(value: string): Request {
  return {
    url: 'not-a-valid-url',
    headers: new Headers([[DIAGNOSTIC_AUTH_HEADER, value]]),
  } as Request
}

describe('local diagnostic auth guard', () => {
  it('returns a deterministic diagnostic user only for local dev with the explicit header', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE),
      isDev: true,
      isTest: false,
      isProd: false,
    })

    expect(user).toEqual({
      id: 'local-diagnostic-user',
      username: 'diagnostic_user',
      role: 'diagnostic',
      createdAt: new Date('2026-07-29T00:00:00.000Z'),
      favorites: [],
      preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
    })
  })

  it('does not return a diagnostic user when the explicit header is missing in local dev', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(null),
      isDev: true,
      isTest: false,
      isProd: false,
    })

    expect(user).toBeNull()
  })

  it('does not return a diagnostic user when the explicit header is wrong in local dev', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader('wrong-value'),
      isDev: true,
      isTest: false,
      isProd: false,
    })

    expect(user).toBeNull()
  })

  it('does not return a diagnostic user in production even with the explicit header', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE),
      isDev: false,
      isTest: false,
      isProd: true,
    })

    expect(user).toBeNull()
  })

  it('returns a diagnostic user for localhost requests with the explicit header in test mode', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE, 'http://localhost/player'),
      clientAddress: '::1',
      isDev: false,
      isTest: true,
      isProd: false,
    })

    expect(user?.id).toBe('local-diagnostic-user')
  })

  it('returns a diagnostic user for 127.0.0.1 requests with the explicit header in test mode', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE, 'http://127.0.0.1:4321/player'),
      clientAddress: '127.0.0.1',
      isDev: false,
      isTest: true,
      isProd: false,
    })

    expect(user?.id).toBe('local-diagnostic-user')
  })

  it.each([
    'http://192.168.1.25:4321/player',
    'http://10.0.0.10:4321/player',
    'http://172.16.0.10:4321/player',
    'http://dev-machine.local:4321/player',
  ])('does not return a diagnostic user for non-local hosts: %s', (url) => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE, url),
      isDev: true,
      isTest: false,
      isProd: false,
    })

    expect(user).toBeNull()
  })

  it('does not return a diagnostic user when the host is local but the client address is not', () => {
    const user = getLocalDiagnosticUser({
      request: requestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE, 'http://localhost/player'),
      clientAddress: '192.168.1.25',
      isDev: true,
      isTest: false,
      isProd: false,
    })

    expect(user).toBeNull()
  })

  it('does not return a diagnostic user when the request URL host cannot be parsed safely', () => {
    const user = getLocalDiagnosticUser({
      request: invalidUrlRequestWithHeader(DIAGNOSTIC_AUTH_HEADER_VALUE),
      isDev: true,
      isTest: false,
      isProd: false,
    })

    expect(user).toBeNull()
  })
})
