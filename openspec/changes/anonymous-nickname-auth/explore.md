## Exploration: anonymous-nickname-auth

> Superseded product/storage decision (2026-07-30): Supabase is the persistence source of truth for anonymous auth/profile/favorites. Do not implement localStorage-first sync, localStorage fallback storage, or indefinite localStorage preservation. Legacy localStorage favorites, if handled, are optional one-time import input only and should be cleaned up after confirmed Supabase success.

### Current State

The app currently uses custom server-side auth backed by Supabase tables, not Supabase Auth. `src/lib/server/auth.ts` creates `app_users`, bcrypt password hashes, `user_sessions`, and a `radio_app_session` HttpOnly cookie; middleware protects `/player`, `/search`, and `/favorites` by resolving that custom cookie. Auth UI is username/password based through `AuthForm`, `/auth/login`, and `/auth/register`. Favorites are localStorage-first: `src/stores/favorites.ts` loads `radio_favorites`, then `syncFavorites()` replaces local state with `/api/favorites` after auth; changes only sync to the API after the first successful sync. `docs/supabase-setup.sql` enables RLS on custom tables but defines no policies.

Supabase Auth anonymous users are compatible with the desired product direction if the app switches identity from custom `app_users.id` to Supabase `auth.users.id`, stores nickname in a separate profile row, and treats nickname only as display data. A later authorized adjustment before PR 5 made nicknames unique display handles, but still not credentials. Supabase docs confirm anonymous Auth users are still in the `authenticated` role, can be identified by JWT `is_anonymous`, and can be isolated with RLS using `auth.uid()`.

### Affected Areas

- `src/lib/server/auth.ts` — Replace custom session/token/password helpers with Supabase Auth session resolution and profile lookup/creation helpers.
- `src/lib/server/supabase.ts` — Add SSR/browser-safe Supabase client creation using anon key for user-scoped operations; keep service role server-only only where explicitly needed.
- `src/middleware.ts` — Redirect protected routes to a profile/nickname onboarding route before `/player`; use Supabase Auth session instead of `radio_app_session`.
- `src/pages/api/auth/*.ts` — Replace login/register/password endpoints with anonymous sign-in/profile/session endpoints; logout should sign out Supabase Auth session.
- `src/components/AuthForm.tsx`, `src/pages/auth/login.astro`, `src/pages/auth/register.astro` — Replace password auth UI with anonymous profile setup and mandatory risk notice flow.
- `src/lib/auth.ts`, `src/lib/types.ts`, `src/components/Nav.tsx` — Rename user-facing model from `username` credential semantics to `nickname` display semantics.
- `src/stores/favorites.ts`, `src/pages/api/favorites.ts` — Replace localStorage-first sync with Supabase-backed CRUD and optional one-time legacy import/cleanup; API should scope favorites by `auth.uid()`.
- `docs/supabase-setup.sql` — Introduce `profiles` and `favorite_stations` keyed to `auth.users(id)` plus explicit RLS policies.
- `src/i18n/es.json`, `src/i18n/en.json` — Existing app is bilingual; add UI keys in both languages even though artifact text remains English.
- `src/lib/__tests__/auth.test.ts`, `src/stores/__tests__/favorites.test.ts`, `e2e/auth.spec.ts`, protected-route E2E tests — Update coverage for anonymous profile creation, route gating, favorites confirmation, and logout.

### Approaches

1. **Recommended: Supabase anonymous Auth + profiles + RLS** — Use `supabase.auth.signInAnonymously()` to create the identity, then require a profile row with unique display nickname before protected app entry.
   - Pros: Removes password storage, aligns with Supabase Auth/RLS, prevents insecure nickname-as-login, enables per-user favorites through `auth.uid()`.
   - Cons: Requires schema/RLS migration before production use; session-cookie integration must be handled carefully in Astro SSR.
   - Effort: High

2. **Keep custom auth but remove password** — Create `app_users` with nickname only and issue custom sessions.
   - Pros: Smaller code delta and fewer Supabase Auth client changes.
   - Cons: Reintroduces insecure pseudo-auth unless another credential exists; conflicts with product/security constraint that nickname is not a credential.
   - Effort: Medium

3. **Local-only nickname with no backend identity** — Store nickname and favorites entirely in localStorage.
   - Pros: No remote migration required; smallest backend impact.
   - Cons: Does not satisfy Supabase-backed favorites per user, no cross-device persistence, no real server-side auth for protected API routes.
   - Effort: Low

### Recommendation

Proceed with Approach 1. The proposal should explicitly scope a migration from custom username/password sessions to Supabase anonymous Auth, a `profiles` table keyed by `auth.uid()`, RLS-backed favorites keyed by `auth.uid()`, and a profile gate before `/player`. Do not support login by nickname; duplicate nicknames are rejected as display-handle availability conflicts and must not be queried as credentials.

Suggested schema direction:

- `profiles(user_id uuid primary key references auth.users(id) on delete cascade, nickname text not null, accepted_anonymous_risk_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`
- `favorite_stations(user_id uuid not null references auth.users(id) on delete cascade, station_uuid text not null, created_at timestamptz not null default now(), primary key (user_id, station_uuid))`
- RLS: authenticated users may select/insert/update/delete only rows where `user_id = auth.uid()`; profile insert/update `with check (user_id = auth.uid())`; nickname uniqueness is display-handle availability only and not part of RLS identity.

Legacy localStorage favorites migration, if included, should be explicit and one-time: detect legacy local and Supabase favorites after profile creation, show a confirmation modal, merge local into Supabase only after confirmation, and clean up the legacy localStorage copy after confirmed Supabase success. Failed or cancelled imports must not create new localStorage persistence or fallback behavior.

UX requirements:

- A mandatory modal before profile creation explains anonymous-account risk: access depends on this browser/session unless the account is later upgraded/recovered; clearing browser data or losing the session can lose access to server-synced favorites.
- The user must enter a nickname before entering `/player`; nickname is a display name, not a login credential, and may be repeated.
- If local favorites exist, ask whether to import them into the anonymous profile; include skip/cancel and retry states.
- Copy should be added through existing i18n keys in `es.json` and `en.json`.

Suggested chained PR slices under 400 changed lines:

1. Schema/docs + auth contract proposal slice: update SQL docs/RLS and type contracts/tests without UI replacement.
2. Supabase anonymous session plumbing slice: server/client auth helpers, middleware route gate, API session/profile endpoints with unit tests.
3. Profile/risk UX slice: profile setup route/component, mandatory modal, i18n, updated nav copy, E2E for protected route flow.
4. Favorites slice: Supabase-backed CRUD/import, optional legacy cleanup after success, favorites API keyed by `auth.uid()`, unit and E2E tests.
5. Cleanup slice: remove password UI/custom session dead code, update docs/verify reports.

What can be implemented without remote Supabase migration:

- OpenSpec proposal/spec/design/tasks.
- Local code paths behind tests using mocked Supabase clients.
- UI/profile/favorites components and tests for Supabase-backed state with no new localStorage persistence.
- SQL documentation for the required migration.

What needs explicit approval:

- Running Supabase SQL/migrations remotely.
- Deploying Supabase Auth configuration changes, production/staging schema changes, or any remote data migration.
- Pushing branches, opening PRs, deploying previews/production, or touching external project settings.

### Risks

- Supabase SSR cookie handling must prevent auth response caching and must correctly set/clear refreshed cookies in Astro responses.
- Anonymous users are still `authenticated`; RLS must not assume `authenticated` means non-anonymous, and policies must use `auth.uid()` row ownership.
- Existing `docs/supabase-setup.sql` has RLS enabled without policies; moving to anon-key user-scoped access requires explicit policies before production use.
- Current favorites sync overwrites local favorites with remote favorites; this conflicts with Supabase-as-source-of-truth and must be replaced before enabling authenticated favorites.
- Removing custom auth can strand existing `app_users` accounts unless migration/non-goal handling is specified.
- Anonymous account loss is a real product/privacy risk; risk notice acceptance should be recorded without collecting extra PII.

### Ready for Proposal

Yes. The proposal should scope Supabase anonymous Auth, unique display nickname profiles, protected-route profile onboarding before `/player`, Supabase-backed favorites with optional one-time legacy import/cleanup, RLS policies by `auth.uid()`, no nickname-as-credential behavior, and chained PR delivery. It should declare remote Supabase migration and deployment as approval-gated follow-up actions.
