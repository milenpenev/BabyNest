# Feature pages manual verification matrix

Run each scenario in Bulgarian and English, at 375px, 768px, 1024px and 1440px, using Light, Dark and System themes. Confirm there is no horizontal scrolling, raw translation key, unreadable control or collapsed chart.

## Shared behavior

- Switch the selected baby and confirm hero, summaries, charts and history change immediately; with no selected baby, show safe empty values and never combine babies.
- Select Today, 7 days and 30 days. Confirm complete chronological buckets and matching history boundaries.
- Open any history item, edit it, save it and delete it. Confirm the original `ActivityDetailsDrawer` and confirmation dialog are used and all page values update without reload.
- Test no records, one record, partial data, deleted records and invalid timestamps.
- Verify Free shows core tracking/history plus blurred Premium preview linking to `/plans`; Premium shows the real advanced content.

## Sleep `/sleep`

- No sleep, one sleep, overnight sleep spanning two dates, active sleep and paused sleep.
- Start, edit start time, pause, resume and stop through the existing timer card.
- Confirm overnight history contains linked segments on all overlapping local days; selecting either segment edits the original activity and deleting removes it once.
- Confirm totals, day/night split (08:00–20:00 / 20:00–08:00), session counts, averages and chart update after edit/delete.
- Confirm one-point chart remains visible and empty data shows a localized state.

## Feeding `/feeding`

- Start left and right, switch breast, pause, resume and finish through the existing breastfeeding card.
- Add a bottle through the existing quick-add form; test breast milk/formula and invalid amount/time.
- Verify combined breastfeeding/bottle history opens the shared drawer and edits/deletes correctly.
- Verify total feedings, breast/bottle counts, durations, volume, averages and left/right percentages.
- Confirm Premium charts show complete daily feed count, bottle ml and breastfeeding-minute data.

## Health `/health`

- Add wet, dirty and mixed diapers plus medicine and bath using the existing quick-add forms.
- Verify live latest-diaper age uses the newest selected-baby record and historical intervals only compare consecutive in-period records.
- Confirm 0/1 diaper gives no interval; 2+ records give average and longest values.
- Verify latest medicine name/dose/time, in-period medicine count, latest bath, bath count and bath average for 2+ records.
- Edit/delete each activity type and confirm summaries/history update immediately. Confirm no medical advice is displayed.

## Routing and regression

- Navigate by sidebar to `/sleep`, `/feeding`, `/health`; test browser back/forward and active navigation state.
- Smoke-test Dashboard, Timeline, Statistics, Growth, Plans, Settings and Baby Profile.
- Run `npm run lint`, `npm run build`, then `npm run dev` and check all three URLs return the application shell.
