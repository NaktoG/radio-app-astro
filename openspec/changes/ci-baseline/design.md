# CI Baseline Design

## Approach

Create a single GitHub Actions workflow at `.github/workflows/ci.yml` named `CI` with one stable job named `baseline`. The job runs on pull requests and pushes to `main` and executes the existing package scripts without changing application behavior.

## Decisions

- Use `actions/checkout@v4` and `actions/setup-node@v4` because they are official GitHub actions.
- Pin Node setup to `22` to match the repository `engines.node` declaration.
- Use `npm ci` instead of `npm install` to honor `package-lock.json` reproducibly.
- Keep E2E out of the baseline because the existing Playwright command can require browser installation and additional runtime setup; it should be introduced as a separate reliable workflow later.
- Provide safe placeholder values for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in workflow env only, never production secrets.

## Validation

- Add a strict TDD workflow contract test that fails before the workflow exists and passes after implementation.
- Run the relevant Vitest test file during TDD.
- Run `npm run format:check`, `npm run lint`, `npm run test`, and `npm run build` locally after implementation if feasible.

## Review Boundary

This is a single small configuration work unit under the 400 changed-line review budget. It does not include package script changes unless local validation proves they are required.
