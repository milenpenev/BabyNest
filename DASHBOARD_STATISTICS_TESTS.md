# Dashboard Statistics verification

The compact Dashboard period is a rolling seven local-calendar-day range ending today. Expected chart rows always contain exactly seven chronological buckets; today is the final bucket and no future day is generated.

## Contract checks

- Sleep row: `{ dayKey, label, daySleepMinutes, nightSleepMinutes }`.
- Feeding row: `{ dayKey, label, feedingCount, bottleMl, breastfeedingMinutes }`.
- Diaper row: `{ dayKey, label, wet, dirty, mixed, total }`.
- Every series field is a finite number. Display formatting is applied only by tooltip/title formatters.
- Select a different baby and verify all rows and summaries switch immediately without records from the previous baby.

## Expected scenarios

1. No records: all four charts show their localized seven-day empty state; no unexplained blank chart frame.
2. Same-day nap: only its local-day bucket is non-zero and the day/night minutes match the full Statistics page.
3. Overnight sleep: both overlapping calendar-day buckets are populated; pauses are subtracted once and day/night segments are not duplicated.
4. One breastfeeding session and one bottle: feeding count is 2, breastfeeding minutes and bottle ml remain numeric, and only the correct local-day bucket is populated.
5. Wet, dirty and mixed diapers on one day: that row is `{ wet: 1, dirty: 1, mixed: 1, total: 3 }`.
6. One populated bucket surrounded by zero buckets: non-zero bars remain visible and zero buckets remain present.
7. Edit/delete: change or remove an activity in the shared drawer and verify Dashboard and `/statistics` update without reload.
8. Free/Premium: Free shows only the intentionally blurred PremiumGate preview; Premium shows fully opaque real cards with no overlay.

## Visual matrix

- Check Light, Dark and System themes at 375px, 768px, 1024px and 1440px.
- Metric cards use `bg-white/border-slate-200` and `dark:bg-slate-800/dark:border-slate-700` consistently.
- Verify chart labels, legends, values and empty states are readable, with no horizontal scrolling.
- Switch Bulgarian/English and confirm there are no raw translation keys.

## Commands

- `npm run lint`
- `npm run build`
- `npm run dev`
