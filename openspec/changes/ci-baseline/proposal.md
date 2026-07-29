# CI Baseline Proposal

## Summary

Add a minimal local GitHub Actions CI workflow for `radio-app-astro` so pull requests and pushes to `main` have stable baseline checks before branch protection is configured.

## Scope

- Create `.github/workflows/ci.yml`.
- Use Node 22 and `npm ci` for reproducible installs.
- Run formatting check, lint, unit tests, and build.
- Avoid production secrets by using safe non-secret Supabase placeholders only for CI build compatibility.

## Non-goals

- No remote GitHub changes, commits, pushes, PRs, deployments, or migrations.
- No E2E baseline requirement in this block.
- No application feature, auth, mobile, or Supabase implementation changes.

## Rollback

Remove `.github/workflows/ci.yml` and the CI workflow contract test if the baseline needs to be reverted.
