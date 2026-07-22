# Reminder activity synchronization regression matrix

`nextTriggerAt` is a persisted cache. The source of truth is the reminder schedule plus the current immutable activity collection. `ActivityAwareReminderSync` reconciles once after local-store hydration and after every activity/reminder collection change.

## Feeding timestamps

- Bottle `startedAt=10:00`, 180-minute interval → reference activity is the bottle and next trigger is 13:00.
- Bottle at 10:00 plus completed breastfeeding with `endedAt=12:00` → breastfeeding wins and next trigger is 15:00.
- Edit that breastfeeding `endedAt` to 11:30 without changing array length → next trigger is 14:30.
- Add a newer bottle and then delete it → reference falls back to the currently latest completed feeding.
- Active breastfeeding without `endedAt`, future timestamps, invalid timestamps and another baby's activities are ignored.
- Delete all completed feedings → clear `referenceActivityId`, source becomes `reminder-created`, and fallback uses reminder creation time.

## Diaper timestamps

- Wet diaper at 14:20 plus 180 minutes → 17:20.
- Add mixed diaper at 16:00 → reference changes and next trigger becomes 19:00.
- Edit the mixed diaper to 13:00 → wet diaper becomes latest and next trigger returns to 17:20.
- Delete the latest diaper → select the next most recent wet/dirty/mixed activity; delete all → reminder-created fallback.

## Synchronization behavior

- Run add, edit, delete, replace/import and clear operations while `/reminders` is closed. Dashboard and the next opened Reminders page must already show the recalculated value.
- Two affected reminders are recalculated in one store write; reminders for another baby remain unchanged.
- Re-run synchronization without a functional change: returned changed count is 0 and `updatedAt` remains unchanged.
- Seed a stale persisted `nextTriggerAt`, mount the app and confirm the hydration reconciliation corrects it once without emitting a notification unless genuinely due.
- Reminder due at 13:00, old event created at 13:20, then feeding logged at 13:15 → new activity reference wins and next trigger is 16:15; prior notification history remains unchanged.
- Trigger the same reference, refresh, and confirm `lastTriggeredAt` advances the recurring interval rather than restoring the already-triggered activity time.
- Add an activity exactly as the scheduler tick runs: immutable activity subscription reconciles before the following tick and no duplicate trigger event is created.

## UI and regression

- Keep Dashboard, Feeding and Health open while adding/editing/deleting relevant activities; upcoming time and overdue state update without refresh.
- Switch babies and confirm each reminder remains scoped by its own `babyId`.
- Verify Header notification history is retained and no read/unread state changes during schedule reconciliation.
- Run `npm run lint`, `npm run build`, then `npm run dev`; inspect for update-depth, duplicate-event, invalid-date and translation warnings.
