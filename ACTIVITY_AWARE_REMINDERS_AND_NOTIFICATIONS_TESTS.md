# Activity-aware reminders and Notification Center

## Pure scheduling expectations

- Feeding candidates: bottle uses `startedAt`; completed breastfeeding uses `endedAt`. Exclude active breastfeeding without `endedAt`, invalid/future timestamps and other babies.
- Baby A bottle 10:00 + 180 minutes → 13:00. Completed breastfeeding ending 12:00 becomes latest → 15:00.
- Edit that breastfeeding end to 11:30 → 14:30. Delete it → bottle is latest again → 13:00.
- Baby A diaper 14:20 + 180 minutes → 17:20. Add wet/dirty/mixed diaper at 16:00 → 19:00. Delete it → 17:20.
- With no relevant history, reference source is `reminder-created`; after the first valid activity it changes automatically to the relevant activity source.
- Adding, editing or deleting activities updates `nextTriggerAt` synchronously. An unchanged ISO result does not rewrite reminder objects.

## Trigger and deduplication

- One due occurrence creates exactly one notification with trigger key `reminderId:scheduledTriggerAt`.
- Refresh/reopen with that occurrence still due: the persisted trigger key prevents duplicate in-app history.
- Browser permission denied/unsupported or category disabled: in-app notification is still created; browser notification is not.
- Browser constructor failure does not block in-app history or rescheduling.
- Reopen after multiple missed intervals: create one event for the stored due occurrence, then advance to the first future occurrence.
- Add a relevant activity exactly when due and confirm synchronization happens before the next scheduler tick.

## Notification store

- Unread count, unread/read selectors and selected-baby filtering return consistent results.
- Mark one read: it remains in history with `readAt`.
- Mark all read: badge disappears and history remains.
- Dismiss removes the item from the visible center without affecting the reminder.
- Clear read removes read/dismissed entries; Clear all requires confirmation.
- Add 101 unique events: only the newest 100 remain. Duplicate trigger keys are rejected.
- Switch language after events exist: stored translation keys render in the newly selected language.

## Header UI

- Badge is absent at zero, shows the exact count through 99, then `99+`; accessible label contains the real count.
- Bell opens with unread items first and read items afterward. Outside click and Escape close it.
- Test keyboard focus, independent scrolling, no clipping and no horizontal overflow at 375px, 768px and desktop.
- Feeding → `/feeding`; diaper/medicine/bath → `/health`; sleep → `/sleep`; custom → `/reminders`. Clicking marks read and closes the panel.
- Verify Light, Dark and System themes in Bulgarian and English.

## Regression

- Dashboard Upcoming Reminder follows feeding/diaper rescheduling immediately.
- Reminders page shows localized activity reference or fallback metadata.
- Smoke-test Dashboard, Sleep, Feeding, Health, Timeline, Statistics, Growth, Plans, Settings and Baby Profile.
- Run `npm run lint`, `npm run build`, then `npm run dev`.
