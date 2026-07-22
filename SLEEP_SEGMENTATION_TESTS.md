# Sleep segmentation manual verification matrix

All examples use local browser time. Verify the persisted activity count remains one for every completed sleep.

| Scenario | Input | Expected calendar segments | Expected day/night |
|---|---|---|---|
| Same day A | 10:00–11:00 | one segment, 3600s | day 3600s, night 0 |
| Boundary B | 19:30–21:30 | one segment, 7200s | day 1800s, night 5400s |
| Overnight C | 22:00–06:00 | 22:00–00:00 and 00:00–06:00 | night 28800s, reporting-night key is evening date |
| Morning boundary D | 07:30–09:30 | one segment | night 1800s, day 5400s |
| Paused overnight E | 23:30–01:30, pause 1200s | two 3600s raw segments, 600s pause each | total active 6000s |
| Exact midnight end | 22:00–00:00 | only the starting calendar day | no zero-length next-day segment |
| Exact midnight start | 00:00–02:00 | only the new calendar day | start label is `00:00` in 24h mode |
| Multiple midnights | day 1 23:00–day 3 01:00 | three stable segment IDs | raw/paused/active sums match the original |
| Excessive pause | one hour sleep, pause 7200s | one segment | pause clamps to 3600s, active is 0 |
| Invalid interval | invalid date or end <= start | no segment | no negative values or crash |
| DST transition | interval crossing local DST change | boundaries use local calendar constructors | elapsed seconds reflect the real timestamp difference |

## Invariants

For every scenario verify:

- sum of `rawDurationSeconds` equals `floor((end-start)/1000)`;
- sum of `pausedDurationSeconds` equals the clamped original pause;
- sum of `activeDurationSeconds` equals raw minus pause;
- `daySleepSeconds + nightSleepSeconds` equals active seconds for every segment;
- stable IDs use `<activityId>:<local-day-key>`;
- edit/delete from either segment uses the original activity ID.

## Active sleep

1. Start sleep before midnight and select the previous calendar day: it ends visually at midnight.
2. Select today after midnight: it begins visually at `00:00` and ends temporarily at now.
3. Pause after midnight: the timer remains based on the original start; the current pause is counted once.
4. Resume and finish: active visual entries disappear and completed derived entries replace them without duplicates.

## UI and regression

1. Switch the Timeline calendar-day picker between both days of an overnight sleep.
2. Open both segments and verify the cross-midnight notice and original full interval.
3. Edit the original start/end so an overnight sleep becomes same-day, then reverse it.
4. Delete from the continued segment and verify every derived segment disappears after one confirmation.
5. Verify 12h/24h, Bulgarian/English, Free blurred preview and Premium statistics.
6. Verify Today/7 days/30 days include sleeps by interval overlap, including sleeps starting before the range.
7. Verify Dashboard Today's Sleep uses only today's local segment.
8. Verify sleep charts show separate day and night series and reporting-night post-midnight sleep belongs to the evening date.

## Overnight editor and theme regression

- `20:00 → 08:00`: next-day end, 12 hours, accepted when the resolved end is not in the future.
- `22:30 → 05:30`: next-day end, 7 hours, accepted.
- `23:59 → 00:10`: next-day end, 11 minutes, accepted.
- `21:00 → 21:00`: interpreted as same-day zero duration and rejected.
- `07:00 → 06:59`: next-day end, 23 hours 59 minutes, accepted.
- After every save, verify both Timeline segments and Today/7d/30d statistics update without refresh.
- Switch Light, Dark and System themes and inspect Header, search, avatar, Dashboard, Timeline, Drawer, Statistics metric cards, charts and blurred Premium overlay.
