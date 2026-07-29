import { signal } from '@preact/signals'
import type { User, LoginCredentials, RegisterData, AuthResponse } from './types'

const currentUser = signal<User | null>(null)
const isAuthenticated = signal(false)
const authLoading = signal(true)

export function getCurrentUser() { return currentUser.value }
export function getIsAuthenticated() { return isAuthenticated.value }

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

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await authRequest('/api/auth/login', credentials)
  if (res.success && res.user) {
    currentUser.value = res.user
    isAuthenticated.value = true
  }
  return res
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await authRequest('/api/auth/register', data)
  if (res.success && res.user) {
    currentUser.value = res.user
    isAuthenticated.value = true
  }
  return res
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
  } finally {
    currentUser.value = null
    isAuthenticated.value = false
  }
}
