# Mobile Runtime Diagnostics Tasks

## Review Workload Forecast

- 400-line budget risk: High for the combined local diff; individual slices should stay reviewable.
- Chained PRs recommended: Yes for PR preparation.
- Decision needed before apply: No — user approved artifact cleanup and conceptual commit/PR slice preparation only.
- Chain strategy: stacked-to-main recommended at PR time; no branches or PRs created in this cleanup.

## Phase 1: Local authenticated diagnostics

- [x] 1.1 Add strict TDD coverage for the local diagnostic auth safety guard.
- [x] 1.2 Implement the minimal production-safe local diagnostic auth guard for protected route rendering.
- [x] 1.3 Add Playwright player viewport diagnostics with local API/audio fixtures and overflow/control visibility reporting.
- [x] 1.4 Run focused validation and capture the measured `/player` viewport report.

## Phase 2: User-authorized layout remediation

- [x] Fix WaveBackground and player control layout overflow in the user-authorized minimal CSS/layout remediation block.
- [x] Add overlap/error diagnostics and fix the mobile/tablet control overlap regression found in review.
- [x] Harden diagnostic auth locality so the fixture is loopback-only in dev/test and impossible in production.

## Phase 3: Professional cleanup

- [x] Align proposal, design, spec, tasks, apply progress, verify report, and review ledger with the final implemented scope.
- [x] Document residual risks and recommended commit/PR slices without staging, committing, pushing, or creating PRs.
