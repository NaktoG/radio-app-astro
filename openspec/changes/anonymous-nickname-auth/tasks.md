# Tasks: Anonymous Nickname Auth

## Review Workload Forecast

| Field                   | Value                                                     |
| ----------------------- | --------------------------------------------------------- |
| Estimated changed lines | 800-1,100                                                 |
| 400-line budget risk    | High                                                      |
| Chained PRs recommended | Yes                                                       |
| Suggested split         | Schema/RLS → auth → profile UI → favorites → E2E/security |
| Delivery strategy       | force-chained                                             |
| Chain strategy          | feature-branch-chain                                      |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                             | Likely PR | Notes                                     |
| ---- | -------------------------------- | --------- | ----------------------------------------- |
| 1    | SQL/RLS/contracts                | PR 1      | Tracker base; no remote migration.        |
| 2    | Supabase SSR auth                | PR 2      | Server sign-in and cookie helpers.        |
| 3    | Profile setup and `/player` gate | PR 3      | `/search` stays public.                   |
| 4    | Supabase-backed favorites        | PR 4      | CRUD/import; no localStorage persistence. |
| 4.5  | Unique display nickname contract | Pre-PR5   | Authorized scope adjustment before PR 5.  |
| 5    | E2E/security hardening           | PR 5      | Full-flow verification.                   |

## Phase 1: Schema and Contracts

- [x] 1.1 RED: add SQL/RLS assertions, including favorites UPDATE `USING` + `WITH CHECK` for upsert/import.
- [x] 1.2 Update `docs/supabase-setup.sql` with profile/favorites FKs and explicit per-operation `auth.uid()` RLS.
- [x] 1.3 Update `src/lib/types.ts` and `src/lib/auth.ts`; remove password and localStorage-first contracts.
- [x] 1.4 Validate PR 1 with `npm run test`, `npm run lint`, and `npm run build`.

## Phase 2: Anonymous Auth Plumbing

- [x] 2.1 RED: test server sign-in, cookie restore, missing session/profile, and no nickname/password login.
- [x] 2.2 Add `@supabase/ssr`; browser clients use `auth.persistSession: false` and no auth localStorage.
- [x] 2.3 Update `src/lib/server/supabase.ts` with SSR anon client and Astro cookie `getAll/setAll`; keep service-role server-only.
- [x] 2.4 Rewrite `src/lib/server/auth.ts` and `src/pages/api/auth/{me,logout}.ts`; replace `login/register` with anonymous/profile flow.
- [x] 2.5 Validate PR 2 with `npm run test`, `npm run lint`, and `npm run build`.

## Phase 3: Profile Gate and Risk UX

- [x] 3.1 RED: test risk modal, initial nickname display-name behavior, and rejected unaccepted profile creation.
- [x] 3.2 Update `src/middleware.ts`: `/player` requires session + profile; `/search` remains public.
- [x] 3.3 Replace `src/components/AuthForm.tsx` and `src/pages/auth/*` with profile setup, risk modal, and recovery warning copy.
- [x] 3.4 Update `src/i18n/*.json` for localized nickname, risk, error, and recovery messages.

## Phase 4: Supabase-Backed Favorites

- [x] 4.1 RED: test favorites CRUD/import/upsert, dedupe, retry/cancel, and no localStorage persistence.
- [x] 4.2 Update `src/pages/api/favorites.ts` for authenticated CRUD/import/upsert scoped only by `auth.uid()`.
- [x] 4.3 Update `src/stores/favorites.ts` for Supabase-backed state, optional one-time legacy import cleanup after success, and loading/empty/error states.

## Pre-PR5 Scope Adjustment: Unique Display Nicknames

- [x] 4.5.1 RED: add SQL/API/server/frontend copy tests for normalized unique nickname conflicts and no credential semantics.
- [x] 4.5.2 Update OpenSpec/Engram artifacts from non-unique nicknames to unique display handles that never authorize, recover, or log in users.
- [x] 4.5.3 Update SQL contract docs with normalized unique nickname enforcement while preserving `auth.uid()` RLS identity.
- [x] 4.5.4 Update profile creation behavior and UI copy for duplicate nickname conflicts while preserving risk acceptance and no localStorage persistence.

## Phase 5: E2E and Security Verification

- [x] 5.1 Add Playwright coverage for `/player` gate behavior, mocked/diagnostic restored-profile UI flow, modal, logout warning, and empty auth/profile/favorites localStorage.
- [x] 5.2a Add local mocked E2E/security contract coverage for duplicate normalized nickname conflict, favorites rollback/isolation-by-contract behavior, no client-supplied user id, `auth.uid()` RLS SQL assertions, no user-path service-role use, and no auth/profile/favorites browser storage.
- [ ] 5.2b BLOCKED/MANUAL: run real two-user Supabase/RLS smoke coverage for duplicate nickname conflict, favorites isolation, cross-user upsert RLS rejection, real `/player` cookie/profile restoration, and logout/session loss after approved SQL migration plus anonymous Auth enablement.
- [x] 5.3 Run `npm run format:check:ci`, `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build`; mark tasks complete only after passing or documenting environment blockers. Full `npm run test:e2e` is blocked locally by missing Firefox/WebKit Playwright browser binaries; focused Chromium E2E passed.
