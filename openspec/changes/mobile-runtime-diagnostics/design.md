# Mobile Runtime Diagnostics Design

## Approach

Use a narrow middleware-level diagnostic fixture because `/player` is server-protected before the page can render. The fixture returns a deterministic local user only when all safety conditions pass:

- runtime is non-production (`import.meta.env.PROD` is false), and
- runtime is dev or test (`import.meta.env.DEV` or `MODE === 'test'`), and
- request includes the explicit non-secret header `x-radio-app-local-diagnostic-auth: measure-player-route`, and
- request locality is loopback-only: the request URL hostname must be localhost/loopback and any Astro-provided `clientAddress` must also be loopback.

The Playwright diagnostic test sets that header, fulfills `/api/auth/me`, `/api/favorites`, and `/api/stations` with local fixture data, and stubs `window.Audio` to avoid network audio playback.

The diagnostic report checks the required mobile/tablet viewports for document overflow, overflowing nodes, key control visibility, ancestor opacity false positives, selected-station metadata overlap, and a forced stream-error overlap state. That evidence drove the user-authorized remediation block.

## Layout Remediation

- Keep mobile/tablet player controls in normal flow so play, next, mute, and volume controls cannot overlap station metadata or error alerts.
- Use compact responsive player spacing through tablet widths instead of global overflow masking.
- Constrain decorative WaveBackground behavior so it does not pollute mobile/tablet overflow diagnostics.
- Leave the authenticated nav cluster overflow at 768px out of scope for this change because it belongs to a separate navigation/layout work unit.

## Security Notes

- The diagnostic guard is impossible to activate in production because production mode returns `null` before checking route behavior.
- The header value is explicit and non-secret; it grants only a deterministic fixture user in loopback dev/test requests.
- Normal session auth remains unchanged when the guard does not match.

## Review Boundary

This change started as diagnostics-only, then intentionally expanded after explicit user authorization to include the minimal mobile/tablet CSS/layout remediation proven by the diagnostics. Auth/Supabase behavior, desktop authenticated nav overflow, global lint warnings, and repository-wide formatting drift remain separate work units.
