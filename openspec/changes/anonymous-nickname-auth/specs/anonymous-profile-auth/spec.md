# Anonymous Profile Auth Specification

## Purpose

Define anonymous Supabase Auth identity, required profile onboarding, and protected `/player` access without credential-based login.

## Requirements

### Requirement: Anonymous Identity and Profile Gate

The system MUST create and restore a valid Supabase anonymous Auth session through SSR cookies and MUST block `/player` until the authenticated user has a profile with a nickname and anonymous-risk acceptance. The system MUST NOT require email, phone, password, or localStorage-persisted auth/profile/session state.

#### Scenario: Restore complete anonymous profile

- GIVEN a browser has a valid anonymous session and profile
- WHEN the user opens `/player`
- THEN the system allows access
- AND displays the profile nickname

#### Scenario: Avoid browser auth localStorage

- GIVEN a new anonymous profile is created or restored
- WHEN browser storage is inspected after auth, profile load, and refresh
- THEN no Supabase auth session, profile, or anonymous user data is persisted in localStorage
- AND session restoration uses SSR cookies

#### Scenario: Block missing profile

- GIVEN a browser has an anonymous session without a profile
- WHEN the user opens `/player`
- THEN the system redirects to profile setup or shows the required profile gate

### Requirement: Mandatory Anonymous Risk Acceptance

The system MUST require explicit modal acceptance before every new anonymous profile creation. Nicknames MUST be unique display handles only and MUST NOT be used for login, authorization, account recovery, or any credential-like flow.

#### Scenario: Create anonymous profile

- GIVEN a user has no profile
- WHEN the user enters an available non-empty nickname and accepts the modal
- THEN the system creates a profile for `auth.uid()`
- AND stores the trimmed nickname as the display handle

#### Scenario: Reject duplicate display handle

- GIVEN one anonymous user already has nickname `Radio Fan`
- WHEN another anonymous user tries to create a profile with `radio fan`
- THEN the system MUST reject the duplicate as a nickname availability conflict
- AND the message MUST NOT describe nickname as a login credential, recovery factor, or authorization factor

#### Scenario: Reject unaccepted modal

- GIVEN a user has entered a nickname
- WHEN the user submits without accepting the risk notice
- THEN the system MUST NOT create the profile
- AND shows an accessible localized error

### Requirement: Security, Session Loss, and Operations Gate

Profile rows MUST be scoped by `auth.uid() = user_id`. Browser code MUST NOT use `service_role`. Logout or anonymous session loss MUST explain that anonymous accounts may not be recoverable. Remote migrations, deploys, pushes, PRs, and production data changes MUST require explicit approval.

#### Scenario: Two-user profile isolation

- GIVEN two anonymous users have different profiles
- WHEN either user loads profile data
- THEN only rows for that user's `auth.uid()` are visible

#### Scenario: Anonymous logout warning

- GIVEN an anonymous user chooses logout or loses the session
- WHEN the account state is cleared
- THEN the system shows localized recovery-risk messaging
