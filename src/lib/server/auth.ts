import type { AstroCookies } from 'astro'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from './supabase'
import type { User } from '../types'

export const AUTH_COOKIE = 'radio_app_session'

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

interface DbUser {
  id: string
  username: string
  role: string
  created_at: string
}

function toPublicUser(user: DbUser): User {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: new Date(user.created_at),
    favorites: [],
    preferences: { theme: 'dark', defaultCountry: 'AR', autoPlay: false, volume: 0.7 },
  }
}

export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) return { valid: false, message: 'El alias es obligatorio' }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, message: 'El alias debe tener 3-20 caracteres (letras, números, _ o -)' }
  }
  return { valid: true }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function createToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(AUTH_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(AUTH_COOKIE, { path: '/' })
}

export async function registerUser(username: string, password: string): Promise<{ user: User; token: string }> {
  const validation = validateUsername(username)
  if (!validation.valid) throw new Error(validation.message)
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')

  const supabase = getSupabaseAdmin()
  const alias = username.trim()
  const passwordHash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('app_users')
    .insert({ username: alias, password_hash: passwordHash })
    .select('id, username, role, created_at')
    .single<DbUser>()

  if (error) {
    if (error.code === '23505') throw new Error('Este alias ya está en uso')
    throw new Error('No se pudo crear la cuenta')
  }

  const token = await createSession(data.id)
  return { user: toPublicUser(data), token }
}

export async function loginUser(username: string, password: string): Promise<{ user: User; token: string }> {
  const validation = validateUsername(username)
  if (!validation.valid) throw new Error(validation.message)

  const supabase = getSupabaseAdmin()
  const alias = username.trim()
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, created_at, password_hash')
    .eq('username', alias)
    .single<DbUser & { password_hash: string }>()

  if (error || !data) throw new Error('Credenciales inválidas')

  const valid = await bcrypt.compare(password, data.password_hash)
  if (!valid) throw new Error('Credenciales inválidas')

  const token = await createSession(data.id)
  return { user: toPublicUser(data), token }
}

export async function createSession(userId: string): Promise<string> {
  const token = createToken()
  const tokenHash = await sha256(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString()

  const { error } = await getSupabaseAdmin().from('user_sessions').insert({
    token_hash: tokenHash,
    user_id: userId,
    expires_at: expiresAt,
  })

  if (error) throw new Error('No se pudo crear la sesión')
  return token
}

export async function getSessionUser(cookies: AstroCookies): Promise<User | null> {
  const token = cookies.get(AUTH_COOKIE)?.value
  if (!token) return null

  const tokenHash = await sha256(token)
  const { data, error } = await getSupabaseAdmin()
    .from('user_sessions')
    .select('expires_at, app_users(id, username, role, created_at)')
    .eq('token_hash', tokenHash)
    .single<{ expires_at: string; app_users: DbUser }>()

  if (error || !data || new Date(data.expires_at).getTime() <= Date.now()) return null
  return toPublicUser(data.app_users)
}

export async function deleteSession(cookies: AstroCookies) {
  const token = cookies.get(AUTH_COOKIE)?.value
  if (!token) return
  const tokenHash = await sha256(token)
  await getSupabaseAdmin().from('user_sessions').delete().eq('token_hash', tokenHash)
}
