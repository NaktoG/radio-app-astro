import type { AstroCookies } from 'astro'
import { createSupabaseServerClient } from './supabase'
import type { ProfileRequest, User } from '../types'

type SupabaseError = { message?: string; code?: string }
type SupabaseUser = { id: string; is_anonymous?: boolean }
type SupabaseResult<T> = { data: T | null; error: SupabaseError | null }

interface ProfileRow {
  user_id: string
  nickname: string
  accepted_anonymous_risk_at: string
}

interface ProfileQueryBuilder {
  select(columns: string): {
    eq(column: string, value: string): { single(): Promise<SupabaseResult<ProfileRow>> }
  }
  insert(values: { user_id: string; nickname: string; accepted_anonymous_risk_at: string }): {
    select(columns: string): { single(): Promise<SupabaseResult<ProfileRow>> }
  }
}

export interface AuthSupabaseClient {
  auth: {
    getUser(): Promise<SupabaseResult<{ user: SupabaseUser | null }>>
    signInAnonymously(): Promise<SupabaseResult<{ user: SupabaseUser | null }>>
    signOut(): Promise<{ error: SupabaseError | null }>
  }
  from(table: 'profiles'): ProfileQueryBuilder
}

const DEFAULT_PREFERENCES: User['preferences'] = {
  theme: 'dark',
  defaultCountry: 'AR',
  autoPlay: false,
  volume: 0.7,
}

export const DUPLICATE_NICKNAME_MESSAGE =
  'Nickname is already taken. Choose another display nickname.'

function isDuplicateNicknameError(error: SupabaseError | null): boolean {
  return Boolean(
    error &&
    error.code === '23505' &&
    (error.message?.includes('profiles_nickname_normalized') ||
      error.message?.includes('nickname_normalized'))
  )
}

function toUser(row: ProfileRow): User {
  return {
    userId: row.user_id,
    nickname: row.nickname,
    acceptedAnonymousRiskAt: row.accepted_anonymous_risk_at,
    favorites: [],
    preferences: DEFAULT_PREFERENCES,
  }
}

function getRequestClient(cookies: AstroCookies): AuthSupabaseClient {
  return createSupabaseServerClient(cookies) as unknown as AuthSupabaseClient
}

export function validateNickname(nickname: string): string {
  const trimmed = nickname.trim()
  if (!trimmed) throw new Error('Nickname is required')
  if (trimmed.length > 40) throw new Error('Nickname must be 40 characters or fewer')
  return trimmed
}

export async function getSessionProfile(client: AuthSupabaseClient): Promise<User | null> {
  try {
    const { data: userData, error: userError } = await client.auth.getUser()
    const user = userData?.user
    if (userError || !user) return null

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('user_id, nickname, accepted_anonymous_risk_at')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) return null
    return toUser(profile)
  } catch {
    return null
  }
}

export async function getSessionUser(cookies: AstroCookies): Promise<User | null> {
  try {
    return await getSessionProfile(getRequestClient(cookies))
  } catch {
    return null
  }
}

export async function createAnonymousProfile(
  client: AuthSupabaseClient,
  request: ProfileRequest | { nickname: string; acceptedAnonymousRisk: boolean }
): Promise<User> {
  if (request.acceptedAnonymousRisk !== true) {
    throw new Error('Anonymous risk acceptance is required')
  }

  const nickname = validateNickname(request.nickname)
  const { data, error } = await client.auth.signInAnonymously()
  const user = data?.user
  if (error || !user) throw new Error('Could not create anonymous session')

  const acceptedAt = new Date().toISOString()
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .insert({
      user_id: user.id,
      nickname,
      accepted_anonymous_risk_at: acceptedAt,
    })
    .select('user_id, nickname, accepted_anonymous_risk_at')
    .single()

  if (profileError || !profile) {
    if (isDuplicateNicknameError(profileError)) throw new Error(DUPLICATE_NICKNAME_MESSAGE)
    throw new Error('Could not create profile')
  }
  return toUser(profile)
}

export async function createAnonymousProfileForRequest(
  cookies: AstroCookies,
  request: ProfileRequest | { nickname: string; acceptedAnonymousRisk: boolean }
): Promise<User> {
  return createAnonymousProfile(getRequestClient(cookies), request)
}

export async function signOut(client: AuthSupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut()
  if (error) throw new Error('Could not sign out')
}

export async function signOutRequest(cookies: AstroCookies): Promise<void> {
  await signOut(getRequestClient(cookies))
}
