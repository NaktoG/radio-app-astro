# Proposal: Anonymous Nickname Auth

## Intent

Replace custom username/password sessions with Supabase anonymous Auth plus a required nickname profile before `/player`. Nicknames are unique display handles, never credentials. Supabase is the persistence source of truth for profiles and favorites; localStorage MUST NOT be used for new anonymous auth, profile, session, or Supabase-backed favorites state.

## Scope

### In Scope

- Supabase anonymous session restoration through SSR cookies and protected-route gating before `/player`.
- Mandatory anonymous-account risk modal before each new anonymous profile creation.
- Profile row keyed by `auth.uid()` with unique normalized `nickname` display handle and risk acceptance timestamp.
- Favorites keyed by `auth.uid()` with Supabase-backed CRUD and optional legacy one-time localStorage import/cleanup after confirmed server success.
- RLS policies based on `auth.uid() = user_id`; no service-role browser usage.
- Unit/E2E verification, including two-user isolation.
- Chained PR delivery under the 400 changed-line review budget.

### Out of Scope

- Email, phone, password, account recovery, or account upgrade.
- Nickname login, account recovery by nickname, or authorization by nickname.
- Broad PWA, CI, player, or UX redesign work.
- Remote Supabase migrations, deploys, pushes, PRs, or production data changes without explicit approval.

## Capabilities

### New Capabilities

- `anonymous-profile-auth`: Supabase anonymous identity, session restoration, profile gate, risk acceptance, and nickname display semantics.
- `user-favorites-sync`: Auth-scoped favorites persistence, Supabase-backed CRUD, and optional legacy localStorage one-time import/cleanup behavior.

### Modified Capabilities

- None.

## Approach

Use a server-owned Astro endpoint with a per-request `@supabase/ssr` server client to call `supabase.auth.signInAnonymously()`, set Supabase SSR cookies, and create `profiles(user_id uuid primary key references auth.users(id), nickname text not null, nickname_normalized text generated always as (lower(btrim(nickname))) stored unique, accepted_anonymous_risk_at timestamptz not null, ...)`. Browser Supabase Auth clients MUST NOT persist sessions to localStorage; authenticated profile and favorites operations go through SSR/API cookie-backed clients. Require explicit modal acceptance before creating every new profile. Redirect protected users without profile to onboarding; restore valid sessions from cookies directly. Store `favorite_stations(user_id, station_uuid, primary key(user_id, station_uuid))`. RLS must allow authenticated users to access only rows where `user_id = auth.uid()`.

Favorites are loaded and mutated through Supabase-backed, auth-scoped APIs using cookie-backed session context. New Supabase-backed state MUST NOT be written to localStorage. Legacy localStorage favorites, if handled in this change, are an optional one-time import source only: detect them after profile creation, ask confirmation, merge/dedupe by station id, and remove the legacy localStorage copy only after confirmed Supabase success. If import fails or is cancelled, do not create new localStorage persistence; leave cleanup/import for explicit retry or future cleanup.

## Affected Areas

| Area                                                    | Impact   | Description                                                                            |
| ------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `src/lib/server/auth.ts`, `src/lib/server/supabase.ts`  | Modified | Supabase anonymous session/profile helpers.                                            |
| `src/middleware.ts`, `src/pages/api/auth/*.ts`          | Modified | Profile gate, session/profile/logout endpoints.                                        |
| `src/components/AuthForm.tsx`, `src/pages/auth/*`       | Modified | Profile setup and mandatory risk notice.                                               |
| `src/stores/favorites.ts`, `src/pages/api/favorites.ts` | Modified | Supabase-backed CRUD/import and `auth.uid()` scoping; no new localStorage persistence. |
| `docs/supabase-setup.sql`                               | Modified | Profiles, favorites, RLS policies.                                                     |
| `src/i18n/*.json`, tests/e2e                            | Modified | Bilingual copy and verification.                                                       |

## Risks

| Risk                    | Likelihood | Mitigation                                                                                                                    |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SSR cookie/session bugs | Med        | Unit and E2E session restoration tests.                                                                                       |
| RLS leakage             | Med        | `auth.uid() = user_id` policies and two-user isolation tests.                                                                 |
| Favorites loss          | Med        | Keep Supabase as source of truth; optional legacy import dedupes and cleans localStorage only after confirmed server success. |
| Oversized review        | Med        | Chain PRs: schema/docs; auth plumbing; profile/risk UX; favorites migration; cleanup.                                         |

## Rollback Plan

Before remote approval, revert local proposal/spec/design/tasks or implementation slices. After approved schema rollout, rollback requires disabling new UI routes, restoring previous auth flow, and applying an explicitly approved reverse SQL/data plan. No remote rollback actions happen without approval.

## Dependencies

- Supabase anonymous Auth enabled and SQL/RLS migration approved before production use.
- Validation: `npm run test`, focused E2E for auth/favorites, `npm run lint`, `npm run build`.

## Success Criteria

- [ ] User cannot enter `/player` without anonymous session, risk acceptance, and nickname profile.
- [ ] Duplicate normalized nicknames are rejected as display-handle conflicts and never authorize access.
- [ ] Favorites are isolated by `auth.uid()` across two users.
- [ ] No anonymous auth session, profile, or favorites data is newly persisted in localStorage; any legacy localStorage favorites handling is one-time import/cleanup only.
