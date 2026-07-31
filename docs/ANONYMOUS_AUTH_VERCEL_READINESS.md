# Anonymous Auth Vercel Readiness Checklist

## Scope

Local readiness artifact for the `anonymous-nickname-auth` change. This file does not prove a deployment happened, and the mocked/diagnostic E2E checks do not prove real Supabase cookie restoration or real two-user RLS isolation. It lists the checks that must pass before a Vercel preview or production promotion is authorized.

## Required local gates

- [x] Node.js 22.x is declared in `package.json` and `.node-version`.
- [x] `npm run format:check:ci`
- [x] `npm run lint`
- [x] `npm run test`
- [x] Focused Playwright coverage for anonymous profile UI flows and favorites rollback using local mocks/diagnostic headers.
- [x] `npm run build`
- [ ] Full `npm run test:e2e` across all configured browsers is blocked locally until Firefox and WebKit Playwright browser binaries are installed. Chromium passed.

## Vercel environment prerequisites

- `SUPABASE_URL` must be configured in Vercel Preview and Production.
- `SUPABASE_ANON_KEY` must be configured in Vercel Preview and Production.
- `SUPABASE_SERVICE_ROLE_KEY` is not required for anonymous profile or favorites user paths and must never be exposed to browser code.
- Supabase anonymous Auth must be enabled before user testing.
- `docs/supabase-setup.sql` must be reviewed and applied only after explicit migration approval.

## Security checklist

- [x] `/player` redirects to `/auth/profile` without a restored session/profile.
- [x] Local diagnostic restored-profile flow has E2E coverage without auth/profile/favorites storage keys in `localStorage` or `sessionStorage`; this does not prove real Supabase cookie/profile restoration.
- [x] Profile creation requires explicit risk-modal acceptance.
- [x] Duplicate nicknames are rejected by normalized display-handle availability, not by credential semantics.
- [x] Security contract coverage asserts favorites API uses the restored `auth.uid()` user id server-side and ignores client-supplied user ids; this does not execute real two-user Supabase RLS.
- [x] Favorites mutation failure rolls back optimistic UI state without storage fallback.
- [x] Browser/user paths do not use `service_role`.

## Manual checks before remote deployment

- Confirm Vercel project, team, and root directory before any preview deploy.
- Confirm Supabase Preview/Production projects match the configured env variables without printing secret values.
- Confirm SQL/RLS migration has been approved and applied in the target Supabase project.
- Run a real two-browser Supabase smoke test after approved SQL/RLS migration and anonymous Auth enablement:
  - [ ] User A creates an anonymous profile and reaches `/player` through real Supabase SSR cookies.
  - [ ] User B creates a separate anonymous profile in a separate browser/context.
  - [ ] User B receives a duplicate normalized nickname conflict for User A's nickname with different casing/spacing.
  - [ ] User A favorites remain invisible to User B and User B favorites remain invisible to User A.
  - [ ] A cross-user favorites insert/update/upsert is rejected by real Supabase RLS.
  - [ ] Reloading `/player` restores the real cookie-backed session/profile without diagnostic headers or mocked `/api/auth/me`.
  - [ ] Logout removes the session; subsequent `/player` access redirects to `/auth/profile` and the anonymous session cannot be silently restored.
- Do not run `vercel deploy`, `vercel deploy --prod`, remote Supabase migrations, commits, pushes, or PR creation without explicit approval.

## Local validation evidence

Original PR 5 readiness evidence:

- Passed: `npm run format:check:ci`.
- Passed: `npm run lint` with 5 pre-existing warnings and 0 errors.
- Passed: `npm run test` with 16 files and 80 tests.
- Passed: `npx playwright test tests/e2e/anonymous-nickname-auth.spec.ts --project=chromium` with 5 tests.
- Blocked: `npm run test:e2e` full matrix because local Firefox and WebKit Playwright binaries are missing; Chromium passed 5/5 before the browser-install blocker stopped the remaining projects.
- Passed: `npm run build`.

Latest false-green correction validation under Node 22.23.1:

- Passed: `npx prettier --write` on changed readiness/task/ledger/E2E artifacts.
- Passed: `npm run format:check:ci`.
- Passed: `npm run test` with 16 files and 80 tests.
- Passed: `npm run lint` with 5 pre-existing warnings and 0 errors.
- Passed: `npm run build`.
- Blocked: focused Chromium Playwright rerun because the Playwright webServer could not start the Astro dev server within its startup window; no browser install was run.
