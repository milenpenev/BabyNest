# Cloud Sync v1 test matrix

## Automated/build checks

- `npm run build`: TypeScript and production bundle.
- Apply migrations to a disposable Supabase project with `supabase db reset` or `supabase migration up`.
- Run `supabase db lint` and inspect security-definer/search-path warnings.

## Auth

1. Register and verify email; confirm profile trigger.
2. Sign in with password and magic link; refresh and confirm restored session.
3. Request password reset, open redirect and set a new password.
4. Sign out; confirm Realtime channels are removed and local offline data remains.
5. Confirm missing environment variables show safe UI without breaking local BabyNest.

## Local-first and queue

6. Create baby/activity offline; refresh; inspect Dexie entity and queue persistence.
7. Verify consecutive updates compress, delete supersedes update and per-entity operations serialize.
8. Reconnect; verify exponential retry and manual retry.
9. Confirm tracking UI never waits for a network request.
10. Confirm active timer ticks do not create queue operations.

## Migration

11. Begin with existing localStorage data; login and confirm zero automatic uploads.
12. Create/download backup, inspect counts, explicitly confirm and create a cloud family.
13. Cancel between batches, retry and confirm stable mapped UUIDs/no duplicates.
14. Confirm count verification and retained backup/original localStorage.
15. Confirm migration is blocked by active sleep or breastfeeding.

## Pull, Realtime and conflicts

16. Add bottle online; add diaper offline and reconnect.
17. Edit browser A and confirm browser B through Realtime plus later pull.
18. Delete offline and confirm tombstone propagation/no resurrection.
19. Edit the same entity offline in two sessions; verify unresolved conflict and Keep local/Keep cloud.
20. Confirm cursors advance and full history is not fetched each time.

## RLS/security

21. User A cannot select User B family/babies/activities/audit.
22. Viewer/Doctor direct REST mutations fail; Parent allowed activity writes succeed.
23. Spoofed family/baby association and spoofed actor requests fail.
24. Anonymous requests cannot access user tables.

## Status UI

25. Verify Offline, Pending, Syncing, Synced, Failed and Conflict states in Header and Settings.
26. Verify last sync, pending/failed/conflict counts and Retry.
