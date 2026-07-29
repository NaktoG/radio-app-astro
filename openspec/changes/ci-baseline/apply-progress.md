# Apply Progress — ci-baseline

**Change**: ci-baseline  
**Mode**: Strict TDD  
**Artifact store**: hybrid  
**Scope**: Local-only Block 1 CI baseline; no remotes, commits, pushes, PRs, deploys, migrations, or application implementation changes.

## Cumulative Status

| Task | Status | Notes |
| --- | --- | --- |
| 1.1 Add strict TDD workflow contract coverage for the baseline CI requirements. | Complete | Workflow contract coverage exists in `src/lib/__tests__/ci-workflow.test.ts`. Remediation tightened the format gate assertion so the test requires the exact `format:check:ci` workflow step and rejects a standalone repository-wide `format:check` step. |
| 1.2 Add a minimal GitHub Actions CI workflow using Node 22, `npm ci`, format check, lint, unit tests, and build. | Complete | `.github/workflows/ci.yml` uses Node 22, npm cache, `npm ci`, `npm run format:check:ci`, `npm run lint`, `npm run test`, and `npm run build`; E2E remains excluded. |
| 1.3 Validate locally and persist apply progress in hybrid mode. | Complete | Original Engram apply-progress existed at topic `sdd/ci-baseline/apply-progress` (#308). This OpenSpec artifact now mirrors the cumulative apply-progress and Judgment Day fix history. |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 | `src/lib/__tests__/ci-workflow.test.ts` | Unit / filesystem contract | ✅ `npm run test -- src/lib/__tests__/ci-workflow.test.ts` passed 3/3 before remediation edits. | ✅ Contract tightened before artifact updates: exact CI format command assertion added and standalone repository-wide format command rejected. | ✅ `npm run test -- src/lib/__tests__/ci-workflow.test.ts` passed 3/3 after remediation. | ✅ Existing quality-gate contract includes required baseline commands and E2E exclusion; remediation adds the distinct negative path for standalone `npm run format:check`. | ✅ Assertion changed from substring containment to exact workflow-step matching to avoid false positives. |
| 1.2 | `src/lib/__tests__/ci-workflow.test.ts` | Unit / filesystem contract | ✅ Existing workflow contract passed 3/3 before remediation edits. | ✅ Existing strict TDD history covered workflow creation before implementation; JD-001 added the scoped format gate behavior. | ✅ Workflow currently satisfies Node 22, npm cache, `npm ci`, scoped formatting, lint, test, build, and safe placeholder checks. | ✅ Contract covers runtime/install, quality gates, E2E exclusion, and safe Supabase placeholders. | ➖ No workflow implementation refactor in this remediation; app implementation unchanged. |
| 1.3 | `src/lib/__tests__/ci-workflow.test.ts` | Unit / filesystem contract plus artifact audit | ✅ `tasks.md` already showed 3/3 tasks complete; Engram progress #308 existed before this OpenSpec artifact was created. | ✅ Verification gap identified missing OpenSpec apply-progress as the failing artifact condition. | ✅ This file provides OpenSpec apply-progress with cumulative TDD evidence, command history, and JD-001 history. | ➖ Single artifact presence requirement; history preserved rather than overwritten. | ✅ Progress format consolidates prior task status and fix history without changing existing tasks. |

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run test -- src/lib/__tests__/ci-workflow.test.ts` | Passed | Pre-remediation safety net: 3 tests passed. |
| `npm run test -- src/lib/__tests__/ci-workflow.test.ts` | Passed | Post-remediation focused validation: 3 tests passed. |
| `npm run format:check:ci` | Passed | Scoped CI formatting gate passed locally. |

## Judgment Day Fix History

### JD-001 — Scoped CI formatting gate

- **Problem**: The initial baseline required repository-wide `npm run format:check`, which failed on pre-existing formatting drift and would make branch-protection CI fail before evaluating real changes.
- **Fix**: Replace the required CI workflow format step with `npm run format:check:ci`, scoped to CI-owned baseline files.
- **Artifact alignment**: The normative CI delta spec now requires `npm run format:check:ci` and explicitly states repository-wide formatting cleanup via `npm run format:check` is a separate approved block.
- **Contract-test alignment**: The workflow contract now asserts the exact `run: npm run format:check:ci` step and rejects an exact standalone `run: npm run format:check` step.
- **Review ledger**: `openspec/changes/ci-baseline/review-ledger.md` records JD-001 as verified.

## Deviations

None — remediation aligns the OpenSpec spec, OpenSpec apply-progress artifact, and CI workflow contract test with the verified JD-001 design intent.

## Residual Risks

- Repository-wide `npm run format:check` still checks the whole repository and remains intentionally out of scope for this local-only Block 1 remediation.
- `openspec/config.yaml` still records initialization-era generic format commands; this remediation only updates the normative change spec and CI contract requested for `ci-baseline`.
