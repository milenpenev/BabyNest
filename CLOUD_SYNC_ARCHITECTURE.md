# BabyNest Cloud Sync v1 architecture

## Existing persistence retained

BabyNest currently persists reactive Zustand stores in localStorage. Important keys include `babynest-babies`, `babynest-activities`, `babynest-family`, `babynest-current-user`, timers, reminders, notifications, milestones, vaccinations, memories, settings and subscription data. These keys and their migrations remain untouched. Active sleep and breastfeeding state remains local and live duration is calculated locally.

The v1 cloud slice adds Dexie database `BabyNestCloudV1`. Zustand remains the immediate UI cache, while new baby/activity writes are also recorded in IndexedDB and queued. Existing historical localStorage data is copied only by the explicit migration wizard.

## Relationships and IDs

- Supabase Auth user → `profiles.id` (1:1).
- `families.owner_id` references a profile.
- `family_members` joins profiles to families with role, status and capability overrides.
- `babies.family_id` scopes a baby to one family.
- `activities.family_id` and `activities.baby_id` scope activity access and incremental queries.
- `audit_log.family_id` captures protected database mutations.

Cloud primary keys are UUIDs. Valid client UUIDs are preserved. Legacy IDs such as `filip` and `local-family` receive a stable migration-map UUID stored locally so retries do not duplicate records.

## Local-first write flow

1. Existing domain/store validation and capability checks run.
2. A Dexie entity is written with `pending` metadata.
3. A persistent queue operation is compressed by entity identity.
4. Zustand updates immediately; tracking never waits for network.
5. The worker runs only when online, authenticated and cloud migration is explicitly enabled.
6. Successful operations are removed; failures receive normalized codes and exponential backoff.
7. Pull and Realtime changes are applied to IndexedDB without enqueueing echoes.

Consecutive updates merge; create+update remains create; delete supersedes updates. Operations for the same entity are serialized. Retry is capped before becoming blocked.

## Pull, Realtime and conflicts

Incremental cursors are stored per family/table. Pull requests order by `updated_at`, include tombstones and paginate by 500. Remote rows replace local data only when no pending local mutation exists. A changed remote version against pending local state creates a reviewable conflict. Delete tombstones remain hidden and prevent stale resurrection.

Postgres Changes subscriptions start only for an authenticated, migration-enabled family and cover `family_members`, `babies` and `activities`. They are removed on logout/unmount/family change. Realtime is an accelerator; incremental pull remains authoritative for missed events.

## Active timers

Timer ticks are never synchronized. V1 syncs completed activities and meaningful saved state only. Migration is blocked while sleep or breastfeeding is active. Concurrent active-session control and cross-device timer takeover require a Phase 2 server-side lease/version design.

## Migration risks and safeguards

- Existing IDs may not be UUIDs: stored mapping is used.
- localStorage may exceed cloud schema expectations: backup precedes upload.
- Partial batch failure: completed upserts remain safe and retry is idempotent.
- Existing active timers: wizard blocks migration.
- Cloud family must exist before baby/activity upload.
- No login or session event automatically uploads local data.
- Backup and original localStorage remain after success.

## V1 entities

Profiles, families, family members, babies, activities and audit log. Dexie also stores queue, cursors, conflicts and device identity.

## Phase 2 plan

Add entity repositories/migrations in this order: growth projections, vaccinations, milestones, reminders, settings, memories/media, notifications, report artifacts and subscription/billing. Each uses the same soft-delete/version metadata, queue compression, cursor pull and RLS capability model. Media requires Supabase Storage policies, resumable upload and quota UX. Billing requires trusted server-side webhook state.
