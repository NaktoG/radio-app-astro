# User Favorites Sync Specification

## Purpose

Define identity-scoped favorite stations with Supabase as source of truth and no new localStorage persistence.

## Requirements

### Requirement: Auth-Scoped Favorites CRUD

The system MUST create, read, update/upsert, and delete favorites only for the authenticated anonymous identity through Supabase-backed APIs. Favorite rows MUST be scoped by `auth.uid() = user_id`, browser code MUST NOT use `service_role`, and new Supabase-backed favorite state MUST NOT be persisted in localStorage.

#### Scenario: Manage own favorite

- GIVEN an anonymous user has a valid profile
- WHEN the user favorites or unfavorites a station
- THEN the change is persisted for that user's `auth.uid()` only

#### Scenario: Prevent cross-user access

- GIVEN two anonymous users exist
- WHEN user A requests favorites after user B saves favorites
- THEN user A cannot read, change, or delete user B's favorites

#### Scenario: Upsert own favorites only

- GIVEN an anonymous user imports or updates favorites
- WHEN the API upserts favorite rows
- THEN only rows matching that user's `auth.uid()` can be changed
- AND cross-user upserts are rejected by RLS

### Requirement: Explicit LocalStorage Import

Legacy localStorage favorites MAY be offered as an optional one-time import source only. The system MUST ask for explicit confirmation, MUST dedupe by station identity, MUST write the merged result to Supabase before cleanup, and MUST NOT preserve localStorage favorites indefinitely as fallback storage.

#### Scenario: Confirm and dedupe import

- GIVEN localStorage and server favorites both exist
- WHEN the user confirms import
- THEN the system merges favorites without duplicates
- AND removes the legacy localStorage copy only after confirmed Supabase success

#### Scenario: Import failure recovery

- GIVEN a confirmed import fails before server success
- WHEN the error is shown
- THEN no new Supabase-backed state is written to localStorage
- AND the user can retry or cancel without treating localStorage as ongoing persistence

#### Scenario: Do not persist favorites to localStorage

- GIVEN favorites are loaded, imported, updated, or deleted
- WHEN browser storage is inspected after the operation
- THEN no Supabase-backed favorites or auth-scoped favorite metadata is persisted in localStorage

### Requirement: User-Facing States and Release Safety

Favorites UI MUST provide accessible, localized modal, form, loading, empty, retry, cancel, and error states for Supabase-backed CRUD/import. Remote migrations, deploys, pushes, PRs, and production data changes MUST require explicit approval.

#### Scenario: Accessible favorites feedback

- GIVEN a CRUD or import operation is pending, empty, failed, or complete
- WHEN the user interacts with the favorites UI
- THEN status and actions are keyboard-accessible and localized
