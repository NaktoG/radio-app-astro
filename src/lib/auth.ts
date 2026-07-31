import { signal } from '@preact/signals'
import type { AuthResponse, ProfileRequest, User } from './types'

const currentUser = signal<User | null>(null)
const isAuthenticated = signal(false)
const authLoading = signal(true)

export function getCurrentUser() {
  return currentUser.value
}
export function getIsAuthenticated() {
  return isAuthenticated.value
}

export function useAuth() {
  return { currentUser, isAuthenticated, authLoading }
}

async function authRequest(path: string, body?: unknown): Promise<AuthResponse> {
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function initAuth() {
  authLoading.value = true
  try {
    const res = await authRequest('/api/auth/me')
    currentUser.value = res.success && res.user ? res.user : null
    isAuthenticated.value = Boolean(res.success && res.user)
  } catch {
    currentUser.value = null
    isAuthenticated.value = false
  } finally {
    authLoading.value = false
  }
}

export async function createAnonymousProfile(request: ProfileRequest): Promise<AuthResponse> {
  const res = await authRequest('/api/auth/anonymous', request)
  if (res.success && res.user) {
    currentUser.value = res.user
    isAuthenticated.value = true
  }
  return res
}

export async function login(): Promise<AuthResponse> {
  return { success: false, message: 'Password login has been replaced by anonymous profiles.' }
}

export async function register(): Promise<AuthResponse> {
  return {
    success: false,
    message: 'Password registration has been replaced by anonymous profiles.',
  }
}

export async function logout(): Promise<AuthResponse | null> {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    return response.json()
  } finally {
    currentUser.value = null
    isAuthenticated.value = false
  }
}
