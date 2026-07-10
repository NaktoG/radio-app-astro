import { signal } from '@preact/signals'
import bcrypt from 'bcryptjs'
import type { User, LoginCredentials, RegisterData, AuthResponse } from './types'
import { StorageUtil } from './storage'

/**
 * AUTH CLIENT-SIDE — LIMITACIONES CONOCIDAS
 *
 * Esta auth es client-side uniquement. NO es segura para producción real.
 * - No hay backend que valide credenciales
 * - El rate limiting es bypassable (borrar localStorage, incógnito)
 * - Los hashes de password se guardan en localStorage del navegador
 * - El "token" es opaco y solo sirve para detectar sesión expirada
 *
 * Para auth real, mover a un backend con base de datos server-side.
 */

const STORAGE_KEYS = {
  USER_DATA: 'radio_app_user_data',
  AUTH_TOKEN: 'radio_app_auth_token',
  USER_PASSWORD: 'radio_app_user_password', // hash del usuario actual
  RATE_LIMIT: 'radio_app_rate_limit'
}

interface RateLimitData {
  attempts: number
  lastAttempt: number
  blockedUntil?: number
}

const MAX_ATTEMPTS = 5
const TIME_WINDOW = 15 * 60 * 1000
const BLOCK_DURATION = 30 * 60 * 1000
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 días en ms

const AUTH_COOKIE = 'radio_app_session'

function setAuthCookie() {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + SESSION_DURATION).toUTCString()
  document.cookie = `${AUTH_COOKIE}=true;path=/;expires=${expires};SameSite=Lax`
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;SameSite=Lax`
}

const currentUser = signal<User | null>(null)
const isAuthenticated = signal(false)
const authLoading = signal(true)

/**
 * Genera un token opaco aleatorio (no es JWT, no contiene datos).
 * Solo sirve para marcar que hay una sesión activa con expiración.
 */
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getTokenExpiry(): number {
  return Date.now() + SESSION_DURATION
}

function checkTokenExpiry(token: string): boolean {
  if (!token) return false
  const parts = token.split('|')
  if (parts.length !== 2) return false
  const expiry = Number(parts[1])
  if (!expiry || isNaN(expiry)) return false
  return Date.now() < expiry
}

function buildTokenWithExpiry(token: string): string {
  return `${token}|${getTokenExpiry()}`
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) return { valid: false, message: 'El alias es obligatorio' }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, message: 'El alias debe tener 3-20 caracteres (letras, números, _ o -)' }
  }
  return { valid: true }
}

function checkRateLimit(identifier: string): { allowed: boolean; message?: string } {
  const allData = StorageUtil.getItem<Record<string, RateLimitData>>(STORAGE_KEYS.RATE_LIMIT) || {}
  const data = allData[identifier] || { attempts: 0, lastAttempt: 0 }
  const now = Date.now()

  if (data.blockedUntil && now < data.blockedUntil) {
    const min = Math.ceil((data.blockedUntil - now) / 60000)
    return { allowed: false, message: `Demasiados intentos. Intenta de nuevo en ${min} minutos.` }
  }
  if (now - data.lastAttempt > TIME_WINDOW) return { allowed: true }
  if (data.attempts >= MAX_ATTEMPTS) {
    data.blockedUntil = now + BLOCK_DURATION
    allData[identifier] = data
    StorageUtil.setItem(STORAGE_KEYS.RATE_LIMIT, allData)
    return { allowed: false, message: 'Demasiados intentos. Cuenta bloqueada por 30 minutos.' }
  }
  return { allowed: true }
}

function recordAttempt(identifier: string, success: boolean) {
  const allData = StorageUtil.getItem<Record<string, RateLimitData>>(STORAGE_KEYS.RATE_LIMIT) || {}
  const data = allData[identifier] || { attempts: 0, lastAttempt: 0 }
  const now = Date.now()
  if (success) {
    delete allData[identifier]
  } else {
    if (now - data.lastAttempt > TIME_WINDOW) {
      data.attempts = 1
    } else {
      data.attempts++
    }
    data.lastAttempt = now
    allData[identifier] = data
  }
  StorageUtil.setItem(STORAGE_KEYS.RATE_LIMIT, allData)
}

function generateUserId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `usr_${timestamp}_${random}`
}

export function getCurrentUser() { return currentUser.value }
export function getIsAuthenticated() { return isAuthenticated.value }

export function useAuth() {
  return { currentUser, isAuthenticated, authLoading }
}

export function initAuth() {
  const user = StorageUtil.getItem<User>(STORAGE_KEYS.USER_DATA)
  const token = StorageUtil.getItem<string>(STORAGE_KEYS.AUTH_TOKEN)

  if (user && token && checkTokenExpiry(token)) {
    currentUser.value = user
    isAuthenticated.value = true
  } else {
    if (token) {
      StorageUtil.removeItem(STORAGE_KEYS.USER_DATA)
      StorageUtil.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      StorageUtil.removeItem(STORAGE_KEYS.USER_PASSWORD)
    }
  }
  authLoading.value = false
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const validation = validateUsername(credentials.username)
  if (!validation.valid) return { success: false, message: validation.message! }

  const alias = credentials.username.trim()
  const rateCheck = checkRateLimit(alias)
  if (!rateCheck.allowed) return { success: false, message: rateCheck.message! }

  // Solo verificamos contra el usuario guardado en este navegador
  const storedHash = StorageUtil.getItem<string>(STORAGE_KEYS.USER_PASSWORD)
  const storedUser = StorageUtil.getItem<User>(STORAGE_KEYS.USER_DATA)

  if (!storedHash || !storedUser || storedUser.username !== alias) {
    recordAttempt(alias, false)
    return { success: false, message: 'Credenciales inválidas' }
  }

  const valid = await bcrypt.compare(credentials.password, storedHash)
  if (!valid) {
    recordAttempt(alias, false)
    return { success: false, message: 'Credenciales inválidas' }
  }

  recordAttempt(alias, true)

  const token = buildTokenWithExpiry(generateToken())
  StorageUtil.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  currentUser.value = storedUser
  isAuthenticated.value = true
  setAuthCookie()

  return { success: true, user: storedUser, token, message: '¡Inicio de sesión exitoso!' }
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const validation = validateUsername(data.username)
  if (!validation.valid) return { success: false, message: validation.message! }

  if (data.password.length < 8) {
    return { success: false, message: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (data.password !== data.confirmPassword) {
    return { success: false, message: 'Las contraseñas no coinciden' }
  }

  const alias = data.username.trim()
  const rateCheck = checkRateLimit(`reg_${alias}`)
  if (!rateCheck.allowed) return { success: false, message: rateCheck.message! }

  // Verificar si ya existe un usuario en este navegador
  const existingUser = StorageUtil.getItem<User>(STORAGE_KEYS.USER_DATA)
  if (existingUser && existingUser.username === alias) {
    return { success: false, message: 'Este alias ya está en uso en este navegador' }
  }

  const userId = generateUserId()
  const passwordHash = await bcrypt.hash(data.password, 12)

  const newUser: User = {
    id: userId,
    username: alias,
    role: 'user',
    createdAt: new Date(),
    favorites: [],
    preferences: { theme: 'light', defaultCountry: 'US', autoPlay: false, volume: 0.7 }
  }

  // Solo guardamos el usuario actual y su hash, no una DB de todos los usuarios
  StorageUtil.setItem(STORAGE_KEYS.USER_DATA, newUser)
  StorageUtil.setItem(STORAGE_KEYS.USER_PASSWORD, passwordHash)

  const token = buildTokenWithExpiry(generateToken())
  StorageUtil.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  currentUser.value = newUser
  isAuthenticated.value = true
  setAuthCookie()

  return { success: true, user: newUser, token, message: '¡Registro exitoso!' }
}

export function logout() {
  StorageUtil.removeItem(STORAGE_KEYS.USER_DATA)
  StorageUtil.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  StorageUtil.removeItem(STORAGE_KEYS.USER_PASSWORD)
  currentUser.value = null
  isAuthenticated.value = false
  clearAuthCookie()
}
