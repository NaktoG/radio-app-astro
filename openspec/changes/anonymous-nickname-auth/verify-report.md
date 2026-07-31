# Verify Report: Anonymous Nickname Auth — PR 5 Readiness

## Scope

PR 5 local E2E/security readiness only. No remote Supabase migration, Vercel deploy, commit, push, or PR was performed.

## Result

PASS WITH DOCUMENTED ENVIRONMENT BLOCKERS for local/mock readiness only.

This report does **not** prove real Supabase cookie restoration, real two-user favorites isolation, or real cross-user RLS rejection. The current Playwright E2E coverage uses local diagnostic headers and mocked API responses for restored-profile paths; SQL/security tests provide static/contract evidence only.

## Commands

Previous PR 5 local validation evidence preserved from the original readiness pass:

| Command                                                                            | Result  | Notes                                                                                                              |
| ---------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run format:check:ci`                                                          | PASS    | Scoped CI format baseline passed.                                                                                  |
| `npm run lint`                                                                     | PASS    | 0 errors, 5 pre-existing warnings.                                                                                 |
| `npm run test`                                                                     | PASS    | 16 files, 80 tests.                                                                                                |
| `npx playwright test tests/e2e/anonymous-nickname-auth.spec.ts --project=chromium` | PASS    | 5 Chromium E2E tests.                                                                                              |
| `npm run test:e2e`                                                                 | BLOCKED | Chromium passed 5/5; Firefox and WebKit/mobile failed because local Playwright browser binaries are not installed. |
| `npm run build`                                                                    | PASS    | Astro/Vercel server build completed with Node 22.23.1.                                                             |

Latest false-green correction validation under Node 22.23.1:

| Command                                                                            | Result  | Notes                                                                                                            |
| ---------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `npx prettier --write ...`                                                         | PASS    | Formatted changed readiness/task/ledger/E2E artifacts.                                                           |
| `npm run format:check:ci`                                                          | PASS    | Scoped CI format baseline passed.                                                                                |
| `npm run test`                                                                     | PASS    | 16 files, 80 tests.                                                                                              |
| `npm run lint`                                                                     | PASS    | 0 errors, 5 pre-existing warnings.                                                                               |
| `npm run build`                                                                    | PASS    | Astro/Vercel server build completed.                                                                             |
| `npx playwright test tests/e2e/anonymous-nickname-auth.spec.ts --project=chromium` | BLOCKED | Playwright webServer could not start the Astro dev server within its startup window; no browser install was run. |

## Coverage

- Direct `/player` access without restored profile redirects to `/auth/profile`.
- Mocked local diagnostic restored-profile flow accesses `/player`, displays nickname, survives reload, and avoids auth/profile/favorites storage keys. This is a UI/middleware diagnostic smoke, not proof of real Supabase cookie/profile restoration.
- Profile setup requires risk modal acceptance before calling profile creation.
- Duplicate normalized nickname conflict is surfaced without credential/recovery/authorization wording.
- Logout displays anonymous recovery-risk warning before redirect.
- Failed favorites mutation rolls back optimistic UI state and keeps favorites out of storage.
- Security contract tests verify favorites are intended to be scoped from restored session user id, not client-supplied ids; RLS SQL text uses `auth.uid()` rather than nickname; browser auth/profile/favorites paths avoid `localStorage`/`sessionStorage`; Vercel readiness requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`. These tests do not execute real Supabase RLS with two users.

## Blockers / Manual Follow-up

- Install Firefox and WebKit Playwright browsers before declaring full cross-browser E2E green: `npx playwright install`.
- Real two-browser Supabase smoke testing still requires approved remote/local Supabase environment setup with anonymous Auth enabled and SQL/RLS applied.
- Vercel deploy readiness requires confirming Vercel project/team/root and Supabase env variables without printing secret values.

### Required manual/remote smoke checklist

Run only after explicit approval for SQL migration/application and anonymous Auth enablement in the target Supabase environment:

- [ ] User A can create an anonymous profile and reach `/player` through real Supabase SSR cookies.
- [ ] User B can create a separate anonymous profile in a separate browser/context.
- [ ] User B receives a duplicate normalized nickname conflict when attempting User A's nickname with different casing/spacing.
- [ ] User A favorites remain invisible to User B and User B favorites remain invisible to User A.
- [ ] A cross-user favorites insert/update/upsert is rejected by real Supabase RLS.
- [ ] Reloading `/player` restores the real cookie-backed session/profile without diagnostic headers or mocked `/api/auth/me`.
- [ ] Logout removes the session; subsequent `/player` access redirects to `/auth/profile` and the anonymous session cannot be silently restored.
