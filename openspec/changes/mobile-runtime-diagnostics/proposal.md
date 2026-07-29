# Mobile Runtime Diagnostics Proposal

## Summary

Add a local-only diagnostic fixture for measuring the authenticated `/player` route at required mobile/tablet viewports, then use that evidence to remediate the confirmed mobile/tablet player layout issues without remote Supabase writes.

## Scope

- Add a production-safe local diagnostic auth guard for dev/test runtime measurement.
- Add Playwright diagnostics that render `/player`, mock remote data locally, and report overflowing nodes, control visibility, and overlap/error states.
- Remediate the measured mobile/tablet player layout issues: clipped/offscreen controls, WaveBackground overflow noise, and control overlap with metadata or error alerts.
- Preserve production auth/Supabase/favorites behavior; diagnostic auth remains local-only and non-production.

## Non-goals

- No auth/Supabase anonymous-session migration.
- No authenticated desktop/tablet nav overflow remediation at 768px.
- No repository-wide lint or formatting cleanup.
- No remote actions, commits, pushes, deployments, migrations, or `.env` reads/prints.

## Rollback

Remove `src/lib/server/diagnosticAuth.ts`, its unit test, the middleware import/use, `e2e/player-diagnostics.spec.ts`, and the scoped player/WaveBackground layout changes in `src/components/AudioPlayer.tsx`, `src/components/RadioPlayer.tsx`, `src/components/WaveBackground.tsx`, and `src/styles/global.css`.
