## Linked Issue

Closes #5

## PR Type

- [x] New feature
- [ ] Bug fix
- [ ] Documentation only
- [ ] Code refactoring
- [ ] Maintenance/tooling
- [ ] Breaking change

## Summary

- Anonymous nickname auth with Supabase RLS (signInAnonymously + profile creation)
- Duplicate nickname rejection with normalized uniqueness
- Risk modal, logout warning, mobile drawer nickname display
- 15 E2E tests (Chromium + Firefox + WebKit) + 80 unit tests

## Changes

| File | Change |
|------|--------|
| `src/lib/server/supabase.ts` | Supabase SSR client with parseCookieHeader for Astro 7 |
| `src/lib/server/auth.ts` | Anonymous profile creation, session management |
| `src/middleware.ts` | Auth redirect for /player without profile |
| `src/pages/api/auth/anonymous.ts` | Anonymous signup endpoint |
| `src/pages/api/favorites.ts` | Favorites CRUD with RLS |
| `src/components/Nav.tsx` | Mobile drawer nickname + logout |
| `src/components/AuthForm.tsx` | Profile setup form with risk modal |
| `src/stores/favorites.ts` | Optimistic favorites with rollback |
| `tests/e2e/anonymous-nickname-auth.spec.ts` | 15 E2E tests across 3 browsers |
| `docs/supabase-setup.sql` | SQL migration (profiles + favorite_stations + RLS) |

## Test Plan

- [x] `npm run format:check:ci` passes
- [x] `npm run lint` passes (0 errors, 5 pre-existing warnings)
- [x] `npm run test` — 80/80 unit tests pass
- [x] `npx playwright test` — 15/15 E2E pass (chromium + firefox + mobile)
- [x] `npm run build` passes
- [x] Production deploy verified: https://radio-app-astro.vercel.app
- [x] Supabase RLS verified: two-user isolation, duplicate nickname rejection

## Contributor Checklist

- [x] Linked an approved issue (#5)
- [x] Added exactly one `type:*` label
- [x] Ran shellcheck on modified scripts
- [x] Skills tested in at least one agent
- [x] Docs updated if behavior changed
- [x] Conventional commit format
- [x] No `Co-Authored-By` trailers
