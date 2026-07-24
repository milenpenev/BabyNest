# Local-to-cloud migration tests

1. Detect current baby/activity counts without writing cloud data.
2. Require authenticated user, backup creation and explicit confirmation.
3. Create owner family membership before uploading babies.
4. Map non-UUID legacy IDs once and retain the mapping across retries.
5. Upload batches of at most 100; cancel before, during and after a batch.
6. Retry after partial failure and verify Supabase upsert produces no duplicates.
7. Verify cloud counts are not below local counts before marking enabled.
8. Keep `babynest-cloud-migration-backup`, migration map and original Zustand localStorage.
9. Block active sleep/breastfeeding migration.
10. Test permission/RLS error, offline interruption, duplicate UUID and expired session.
