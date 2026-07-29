# Review Ledger — mobile-runtime-diagnostics

## Judgment Day Round 1

Status: ESCALATED — after two fix rounds, one scoped re-review judge approved the diagnostic, but the other kept JD-A-001 open because ancestor opacity can still make a control invisible while the target element itself reports opacity `1`.

| id       | lens         | location                                 | severity | status | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------- | ------------ | ---------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JD-A-001 | judgment-day | `e2e/player-diagnostics.spec.ts:190-386` | CRITICAL | open   | Round 2 improved the diagnostic with computed display/visibility/opacity, raw rect, clipped rect, visible area, viewport clipping, overflow clipping ancestors, disabled, and aria-disabled checks. Judge A verified the fix. Judge B kept it open because opacity is still checked only on the target element; a control inside an `opacity:0` ancestor can have a valid clipped rect and target opacity `1`, so `fullyVisible` could still pass for an invisible control. |

## Judge B

Judge B returned an empty ledger and approved the slice.

## Judgment Day Round 2

Maximum fix rounds reached. Do not continue the automatic fix loop without a new user decision.

| judge   | verdict   | evidence                                                                                           |
| ------- | --------- | -------------------------------------------------------------------------------------------------- |
| Judge A | APPROVED  | No blocker/critical regressions found; JD-A-001 verified after round 2 visibility/clipping checks. |
| Judge B | ESCALATED | JD-A-001 remains open due missing ancestor opacity evaluation.                                     |

## Judgment Day Round 2

Status: FIXED — user authorized the minimum Round 2 diagnostic visibility fix for JD-A-001 only. Product CSS/layout remains intentionally untouched.

| id       | lens         | location                                 | severity | status | evidence                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | ------------ | ---------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JD-A-001 | judgment-day | `e2e/player-diagnostics.spec.ts:190-309` | CRITICAL | fixed  | `controlDiagnostic()` now reports raw rects, clipped rects, hidden reasons, viewport clipping, clipping ancestor details, disabled/aria-disabled state, and requires `fullyVisible` to pass computed display/visibility/opacity/pointer-events/usability checks plus viewport and overflow ancestor clipping. Assertions still require all key player controls to be fully visible. |

## User-authorized micro-fix: ancestor opacity diagnostics

Status: VERIFIED — user explicitly authorized a new micro-fix outside the exhausted Judgment Day loop. Product CSS/layout remains intentionally untouched. A fresh reliability review returned no findings.

| id       | lens         | location                                 | severity | status | evidence                                                                                                                                                                                                                                                                                                                                                        |
| -------- | ------------ | ---------------------------------------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JD-A-001 | judgment-day | `e2e/player-diagnostics.spec.ts:231-451` | CRITICAL | fixed  | `controlDiagnostic()` now evaluates ancestor opacity in addition to target opacity and reports `effectiveOpacity`, `ancestorOpacityHidden`, and `opacityAncestors`. The E2E diagnostic includes a self-check control under an `opacity:0` ancestor and asserts it is not `fullyVisible`, preventing the false-positive gap without changing product CSS/layout. |

## Fresh Reliability Review

| id  | lens        | location | severity | status | evidence                                                                                 |
| --- | ----------- | -------- | -------- | ------ | ---------------------------------------------------------------------------------------- |
| —   | reliability | —        | —        | info   | Empty ledger: no findings for the user-authorized ancestor opacity diagnostic micro-fix. |

## Judgment Day — Mobile Layout Patch Round 1

Status: ESCALATED — both blind judges found a confirmed CRITICAL issue in the mobile layout patch.

| id     | lens         | location                                                                                                             | severity | status | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------ | ------------ | -------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JD-002 | judgment-day | `src/components/AudioPlayer.tsx:150`, `src/components/AudioPlayer.tsx:188`, `src/components/AudioPlayer.tsx:208-223` | CRITICAL | open   | The patch moved play/next and volume controls to absolute positioning on `<lg`, removing them from normal flow while station metadata and the error alert remain in flow. The container only reserves `min-h-[8rem]`; in compact or error states the absolute volume row can overlap station metadata or the error alert. The diagnostic passed because it checks successful selected-station visibility, not overlap or `hasError` layout. |

## Judgment Day Fix Round 1 — JD-002

Status: VERIFIED — user authorized the current mobile layout remediation for the confirmed JD-002 issue. Both scoped re-review judges verified the fix.

| id     | lens         | location                                                           | severity | status   | evidence                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ------------ | ------------------------------------------------------------------ | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JD-002 | judgment-day | `src/components/AudioPlayer.tsx`, `e2e/player-diagnostics.spec.ts` | CRITICAL | verified | `AudioPlayer` mobile/tablet play, next, mute, and volume controls now participate in normal flow instead of absolute positioning. The diagnostic now covers both selected-station and forced stream-error states, scopes overlap checks to the player card, and asserts play/next/volume do not overlap station heading, metadata, or the error alert while remaining fully visible in required viewports. |

## Scoped Re-review — JD-002

| judge   | verdict  | evidence                                                                                                              |
| ------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| Judge A | APPROVED | Verified controls are back in normal flow and diagnostics cover overlap/error state; no blocker/critical regressions. |
| Judge B | APPROVED | Verified the same and confirmed Playwright Chromium diagnostic passed with 2 tests.                                   |

## Final Diff Review — R1-001

Status: VERIFIED — diagnostic auth remains blocked in production and now requires a loopback request URL plus a loopback `clientAddress` when Astro provides it. Scoped security re-review approved the fix.

| id     | lens     | location                                                                  | severity | status   | evidence                                                                                                                                                                                                                                             |
| ------ | -------- | ------------------------------------------------------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1-001 | security | `src/lib/server/diagnosticAuth.ts`, `src/middleware.ts`, diagnostic tests | CRITICAL | verified | `getLocalDiagnosticUser()` now requires non-production dev/test mode, the exact diagnostic header, and localhost/127.0.0.1/::1 request locality. Middleware passes `context.clientAddress`; LAN/private hosts and non-loopback clients are rejected. |

## Scoped Re-review — R1-001

| lens     | verdict  | evidence                                                                                                                                                                                                                                                                                        |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| security | APPROVED | Diagnostic auth now requires non-production dev/test, exact header, loopback request hostname, and rejects non-loopback `clientAddress` when provided. Tests cover production denial, missing/wrong header, loopback allow, LAN/private host denial, LAN client denial, and invalid URL denial. |

## Final OpenSpec Coherence Cleanup

Status: COMPLETE — stale diagnostics-only artifacts were updated to match the implemented diagnostic auth fixture, mobile/tablet layout remediation, WaveBackground overflow fix, diagnostic auth locality hardening, overlap/error diagnostics, and documented residual risks.

| id      | lens | location                                                                                                            | severity | status | evidence                                                                                                                                                                      |
| ------- | ---- | ------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-001 | docs | `proposal.md`, `design.md`, `specs/player-diagnostics/spec.md`, `tasks.md`, `apply-progress.md`, `verify-report.md` | info     | fixed  | Proposal/design/spec/tasks now describe the final implemented scope instead of the original diagnostics-only boundary. Review history above was preserved rather than erased. |
