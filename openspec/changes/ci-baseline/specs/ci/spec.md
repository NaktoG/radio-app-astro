# CI Baseline Delta Spec

## ADDED Requirements

### Requirement: Minimal CI baseline

The repository MUST provide a GitHub Actions workflow with stable check names suitable for future branch protection.

#### Scenario: Required baseline checks run on pull requests

- **Given** a pull request targets the repository
- **When** the CI workflow runs
- **Then** it MUST install dependencies with `npm ci`
- **And** it MUST run `npm run format:check:ci`
- **And** it MUST run `npm run lint`
- **And** it MUST run `npm run test`
- **And** it MUST run `npm run build`
- **And** repository-wide formatting cleanup via `npm run format:check` MUST remain a separate approved block until the existing formatting drift is remediated.

#### Scenario: CI uses the project runtime

- **Given** the project declares Node `22.x`
- **When** CI sets up Node
- **Then** it MUST use Node 22
- **And** it MUST use dependency caching for npm.

#### Scenario: CI avoids production secrets

- **Given** build-time server configuration may require Supabase environment variables
- **When** CI runs the build
- **Then** it MUST NOT require production Supabase secrets
- **And** any workflow environment values MUST be safe non-secret placeholders.

#### Scenario: E2E is excluded from required baseline

- **Given** Playwright E2E tests may require browser installation and environment-specific readiness
- **When** this baseline CI workflow runs
- **Then** E2E tests SHOULD remain out of the required baseline until a dedicated reliable E2E workflow is designed.
