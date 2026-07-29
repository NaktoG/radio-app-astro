# Player Diagnostics Delta Spec

## ADDED Requirements

### Requirement: Local authenticated player diagnostics

The app MUST provide a local-only way to render `/player` for diagnostic measurement without Supabase session creation or production auth bypass.

#### Scenario: Local diagnostic header renders player

- **Given** a dev/test runtime
- **And** a request includes `x-radio-app-local-diagnostic-auth: measure-player-route`
- **And** the request URL and client address are loopback-local
- **When** `/player` is requested
- **Then** the protected route MUST render with a deterministic diagnostic user.

#### Scenario: Non-local diagnostic requests are rejected

- **Given** a dev/test runtime
- **And** a request includes the diagnostic header
- **When** the request URL or provided client address is not loopback-local
- **Then** diagnostic auth MUST return no user.

#### Scenario: Production cannot use diagnostic auth

- **Given** production runtime
- **And** a request includes the diagnostic header
- **When** diagnostic auth is evaluated
- **Then** it MUST return no user.

### Requirement: Player viewport diagnostic report

The diagnostics MUST measure `/player` at 320x568, 360x800, 375x667, 390x844, 414x896, 430x932, and 768x1024.

#### Scenario: Overflow and controls are reported

- **Given** the local diagnostic fixture
- **When** the Playwright diagnostic runs
- **Then** it MUST report document widths, overflowing nodes, and visibility for station list, selected station heading, play, next, and volume controls
- **And** it MUST treat controls inside hidden opacity ancestors as not fully visible
- **And** it MUST report overlap between player controls, station metadata, and forced error alerts.

### Requirement: Mobile player layout remediation

The player UI MUST keep core playback controls visible and non-overlapping at the required mobile/tablet diagnostic viewports.

#### Scenario: Player controls remain usable on required viewports

- **Given** the local diagnostic fixture
- **When** `/player` renders at 320x568, 360x800, 375x667, 390x844, 414x896, 430x932, and 768x1024
- **Then** play, next, and volume controls MUST be fully visible
- **And** controls MUST NOT overlap selected-station heading/metadata or the forced stream-error alert.

#### Scenario: Decorative background does not cause mobile overflow noise

- **Given** the local diagnostic fixture
- **When** `/player` renders at the required mobile/tablet viewports
- **Then** WaveBackground MUST NOT appear as a mobile/tablet overflowing node in the diagnostic report.
