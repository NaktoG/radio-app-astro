# Design: Anonymous Nickname Auth

## Technical Approach

Replace custom password/session auth with Supabase anonymous Auth plus a required `profiles` row before `/player`, while keeping the Astro SSR route gate and API-owned persistence pattern. Nicknames are unique display handles only; authorization is always Supabase user identity plus RLS. Profiles and favorites are Supabase-backed; localStorage is not a persistence strategy for new anonymous auth/session/profile/favorites state.

Current-state replacement map:

| Current                               | Replace with                        | Notes                                                                                          |
| ------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `app_users.username/password_hash`    | `auth.users` + `profiles.nickname`  | No password, no nickname lookup for auth; nickname is unique display-handle availability only. |
| `user_sessions` + `radio_app_session` | Supabase SSR auth cookies           | Middleware restores session from cookies, never localStorage.                                  |
| `/api/auth/login`, `/register`        | anonymous session/profile endpoints | No credential endpoints remain user-facing.                                                    |
| Admin `favorite_stations` CRUD        | SSR anon-key user client + RLS      | Browser never receives `service_role`.                                                         |
| localStorage overwrite sync           | Supabase-backed CRUD/import         | Optional legacy one-time import only; no new localStorage writes.                              |

## Architecture Decisions

| Decision              | Choice                                                                                                                                                                                                                                                                                                                                                  | Alternatives considered                                      | Rationale                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase client split | Add `@supabase/ssr`; create `src/lib/server/supabase.ts` per-request server client using Astro cookies. Browser code posts to Astro auth/favorites APIs; any public browser Supabase client must set `auth.persistSession: false` and must not handle auth/profile/favorites state. Keep service-role helper server-only and unused for auth/favorites. | Browser `signInAnonymously()` with default Supabase storage. | Supabase browser auth can persist to localStorage by default; server-owned sign-in with SSR cookies is the safest Astro SSR path for the approved no-localStorage rule. |
| Identity contract     | `auth.users.id` is the user id; `profiles.user_id` is primary key.                                                                                                                                                                                                                                                                                      | Continue custom `app_users`; nickname login.                 | Specs require no password and no nickname auth; Supabase Auth owns session validity.                                                                                    |
| Profile gate          | Middleware redirects protected routes to `/auth/profile` when session exists but profile is missing.                                                                                                                                                                                                                                                    | Gate inside only Preact components.                          | SSR gate protects `/player` before hydration and works on Vercel.                                                                                                       |
| Favorites source      | Supabase `favorite_stations` is the source of truth; optional legacy localStorage import is one-time and followed by cleanup after confirmed server success.                                                                                                                                                                                            | localStorage-first sync or indefinite preservation.          | Meets the approved no-localStorage persistence rule while still allowing controlled legacy recovery.                                                                    |
| Nickname uniqueness   | Store `nickname_normalized` as `lower(btrim(nickname))` and enforce uniqueness on that generated column.                                                                                                                                                                                                                                                | Raw `nickname` unique constraint; application-only checks.   | Prevents whitespace/case bypasses while keeping nickname out of authentication, authorization, and recovery semantics.                                                  |

## Data Flow

```text
Browser onboarding modal ──POST /api/auth/anonymous──> SSR server client
        │                                             │
        └──risk + nickname────────────────────────────┴──signInAnonymously + SSR cookies
                         │
Astro middleware ──getUser + profile lookup──> /player or /auth/profile

Favorites UI ──CRUD/import──> /api/favorites ──RLS──> favorite_stations
Legacy localStorage ──optional one-time import──┘
        └── cleanup only after confirmed Supabase success
```

## File Changes

| File                                                    | Action         | Description                                                                                                                                                       |
| ------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`                     | Modify         | Add `@supabase/ssr` for Astro-compatible cookie SSR.                                                                                                              |
| `src/lib/server/supabase.ts`                            | Modify         | Export per-request Supabase SSR client with anon key and Astro cookie `getAll/setAll`; keep admin helper server-only.                                             |
| `src/lib/supabaseClient.ts`                             | Create/modify  | Public browser client only for non-auth public reads if needed; configure `auth.persistSession: false` and do not store auth/profile/favorites state.             |
| `src/lib/server/auth.ts`                                | Rewrite        | Remove bcrypt/session-token logic; expose `getSessionProfile`, `createProfile`, `signOut`.                                                                        |
| `src/pages/api/auth/{login,register}.ts`                | Delete/replace | Replace credential endpoints with server-owned anonymous/profile flow endpoints that set/use SSR cookies.                                                         |
| `src/pages/api/auth/me.ts`, `logout.ts`                 | Modify         | Return anonymous profile state; warn on logout/session loss.                                                                                                      |
| `src/middleware.ts`                                     | Modify         | Gate `/player` by session + profile. Keep `/search` public; if `/favorites` is a private page, require authenticated/profile-scoped access for favorites data/UI. |
| `src/components/AuthForm.tsx`, `src/pages/auth/*`       | Modify         | Replace password forms with profile setup and mandatory risk modal.                                                                                               |
| `src/lib/auth.ts`, `src/lib/types.ts`                   | Modify         | Rename username-facing state to nickname/profile; remove password contracts.                                                                                      |
| `src/stores/favorites.ts`, `src/pages/api/favorites.ts` | Modify         | Add Supabase-backed authenticated CRUD/import, dedupe, retry/cancel states, and no new localStorage persistence.                                                  |
| `docs/supabase-setup.sql`                               | Modify         | Add `profiles`, `favorite_stations` FK to `auth.users(id)`, RLS policies; deprecate custom tables.                                                                |
| `src/i18n/*.json`, tests/e2e                            | Modify         | Localized accessible copy and coverage.                                                                                                                           |

## Interfaces / Contracts

```ts
type Profile = { userId: string; nickname: string; acceptedAnonymousRiskAt: string }
type ProfileRequest = { nickname: string; acceptedAnonymousRisk: true }
type FavoritesImportRequest = { stationUuids: string[]; confirmed: true }
```

SQL shape: `profiles(user_id uuid primary key references auth.users(id) on delete cascade, nickname text not null check (length(trim(nickname)) > 0), nickname_normalized text generated always as (lower(btrim(nickname))) stored unique, accepted_anonymous_risk_at timestamptz not null, created_at timestamptz default now())`; `favorite_stations(user_id uuid references auth.users(id) on delete cascade, station_uuid text not null, created_at timestamptz default now(), primary key(user_id, station_uuid))`.

Duplicate profile creation MUST map PostgreSQL unique-violation errors on `nickname_normalized` to a safe `409 Conflict` response such as “Nickname is already taken. Choose another display nickname.” Copy MUST NOT imply login, account recovery, or authorization by nickname.

Enable RLS on both `profiles` and `favorite_stations`; policies are operation-specific:

| Operation | `profiles` policy                                                                                                     | `favorite_stations` policy                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| SELECT    | `USING ((select auth.uid()) = user_id)`                                                                               | `USING ((select auth.uid()) = user_id)`                                                                              |
| INSERT    | `WITH CHECK ((select auth.uid()) = user_id)`                                                                          | `WITH CHECK ((select auth.uid()) = user_id)`                                                                         |
| UPDATE    | `USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)` when profile updates are supported | `USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)` for import/update/upsert behavior |
| DELETE    | `USING ((select auth.uid()) = user_id)` if profile deletion is supported                                              | `USING ((select auth.uid()) = user_id)`                                                                              |

## Testing Strategy

| Layer       | What to Test                                                                                                                     | Approach                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Unit        | nickname validation, duplicate normalized nickname conflict, modal acceptance, auth state, Supabase favorites CRUD/import/upsert | Vitest first; mock fetch/Supabase clients.                                                          |
| Integration | API rejects no session, no profile, unaccepted risk; no password or nickname login                                               | Route/helper tests with mocked SSR clients and cookie assertions.                                   |
| E2E         | mandatory modal, `/player` gate, cookie session restore, duplicate nickname conflict, logout warning, import retry/cancel        | Playwright; include two anonymous users attempting the same normalized nickname and storage checks. |
| Security    | RLS isolation, no `service_role` in browser, no auth/profile/favorites localStorage, favorites by `auth.uid()`                   | Static tests/search plus two-user isolation tests.                                                  |

Strict TDD for apply: each slice starts with failing tests for its contracts, then minimal implementation, then refactor; no slice is complete without `npm run test` and focused E2E where applicable.

## Migration / Rollout

Remote SQL migrations, Supabase anonymous Auth enablement, deploys, pushes, PRs, and production data changes require explicit approval. Rollback before remote rollout is file revert only. After rollout, disable new UI gates and apply an approved reverse SQL plan; preserve old tables until rollback confidence is explicit.

Chained PR slices under 400 changed lines using feature-branch-chain: (1) SQL/RLS/contracts, (2) SSR Supabase auth plumbing, (3) profile modal/gate UI, (4) Supabase-backed favorites CRUD/import with no new localStorage persistence, (5) E2E/security cleanup.

## Risks

- `/search` remains public by design; adding a profile gate there requires a later product decision because it would expand the approved scope beyond `/player`.
- `/favorites`, if implemented as a private page, must render only authenticated/profile-scoped favorites data and must not expose cross-user records outside RLS.
- Legacy localStorage favorites are optional import input only; preserving them indefinitely is explicitly out of scope for Supabase-backed state.
- Supabase browser clients must never use default auth storage for this feature; sign-in/session mutation belongs to server-owned SSR cookie clients.

## Open Questions

- [ ] Confirm exact Supabase env variable names for public anon key without printing values.
