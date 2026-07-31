import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(resolve(process.cwd(), 'docs/supabase-setup.sql'), 'utf8')
const normalizedSql = sql.replace(/\s+/g, ' ').toLowerCase()

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeSqlClause = (value: string) => value.replace(/\s+/g, ' ').toLowerCase().trim()

const policyStatements = normalizedSql.match(/create policy .*?;/g) ?? []

const expectPolicy = ({
  name,
  table,
  operation,
  clauses,
}: {
  name: string
  table: string
  operation: string
  clauses: string[]
}) => {
  const normalizedName = escapeRegExp(normalizeSqlClause(name))
  const normalizedTable = escapeRegExp(normalizeSqlClause(table))
  const normalizedOperation = escapeRegExp(normalizeSqlClause(operation))
  const normalizedClauses = clauses.map((clause) => escapeRegExp(normalizeSqlClause(clause)))

  expect(normalizedSql).toMatch(
    new RegExp(
      `create policy ${normalizedName} on ${normalizedTable} for ${normalizedOperation} ${normalizedClauses.join(' ')};`
    )
  )
}

describe('Supabase schema contracts', () => {
  it('defines anonymous profiles keyed to auth.users without password tables', () => {
    expect(normalizedSql).toContain('create table if not exists public.profiles')
    expect(normalizedSql).toContain(
      'user_id uuid primary key references auth.users(id) on delete cascade'
    )
    expect(normalizedSql).toContain('nickname text not null')
    expect(normalizedSql).toContain(
      'nickname_normalized text generated always as (lower(btrim(nickname))) stored'
    )
    expect(normalizedSql).toContain(
      'create unique index if not exists profiles_nickname_normalized_unique_idx on public.profiles ((lower(btrim(nickname))))'
    )
    expect(normalizedSql).toContain('accepted_anonymous_risk_at timestamptz not null')
    expect(normalizedSql).not.toContain('password_hash')
    expect(normalizedSql).not.toContain('create table if not exists public.app_users')
  })

  it('includes idempotent upgrade SQL for existing profiles nickname uniqueness', () => {
    expect(normalizedSql).toContain(
      'alter table public.profiles add column if not exists nickname_normalized text generated always as (lower(btrim(nickname))) stored'
    )
    expect(normalizedSql).toContain(
      'create unique index if not exists profiles_nickname_normalized_unique_idx on public.profiles ((lower(btrim(nickname))))'
    )
  })

  it('treats nickname uniqueness as display-handle availability, not auth or RLS identity', () => {
    expect(normalizedSql).toContain('lower(btrim(nickname))')
    expect(normalizedSql).not.toMatch(/auth\.uid\(\)\s*=\s*nickname|nickname\s*=\s*auth\.uid\(\)/)
    expect(policyStatements).not.toHaveLength(0)
    expect(policyStatements.every((policy) => !policy.includes('nickname'))).toBe(true)
  })

  it('defines favorite stations scoped by auth.users and station primary key', () => {
    expect(normalizedSql).toContain('create table if not exists public.favorite_stations')
    expect(normalizedSql).toContain(
      'user_id uuid not null references auth.users(id) on delete cascade'
    )
    expect(normalizedSql).toContain('primary key (user_id, station_uuid)')
  })

  it('uses operation-specific RLS policies for profiles', () => {
    expect(normalizedSql).toContain('alter table public.profiles enable row level security')
    expectPolicy({
      name: 'profiles_select_own',
      table: 'public.profiles',
      operation: 'select',
      clauses: ['using ((select auth.uid()) = user_id)'],
    })
    expectPolicy({
      name: 'profiles_insert_own',
      table: 'public.profiles',
      operation: 'insert',
      clauses: ['with check ((select auth.uid()) = user_id)'],
    })
    expectPolicy({
      name: 'profiles_update_own',
      table: 'public.profiles',
      operation: 'update',
      clauses: [
        'using ((select auth.uid()) = user_id)',
        'with check ((select auth.uid()) = user_id)',
      ],
    })
    expectPolicy({
      name: 'profiles_delete_own',
      table: 'public.profiles',
      operation: 'delete',
      clauses: ['using ((select auth.uid()) = user_id)'],
    })
  })

  it('uses operation-specific RLS policies for favorite upsert/import isolation', () => {
    expect(normalizedSql).toContain(
      'alter table public.favorite_stations enable row level security'
    )
    expectPolicy({
      name: 'favorite_stations_select_own',
      table: 'public.favorite_stations',
      operation: 'select',
      clauses: ['using ((select auth.uid()) = user_id)'],
    })
    expectPolicy({
      name: 'favorite_stations_insert_own',
      table: 'public.favorite_stations',
      operation: 'insert',
      clauses: ['with check ((select auth.uid()) = user_id)'],
    })
    expectPolicy({
      name: 'favorite_stations_update_own',
      table: 'public.favorite_stations',
      operation: 'update',
      clauses: [
        'using ((select auth.uid()) = user_id)',
        'with check ((select auth.uid()) = user_id)',
      ],
    })
    expectPolicy({
      name: 'favorite_stations_delete_own',
      table: 'public.favorite_stations',
      operation: 'delete',
      clauses: ['using ((select auth.uid()) = user_id)'],
    })
  })
})
