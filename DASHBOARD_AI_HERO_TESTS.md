# Intelligent Dashboard Hero verification

## Data states

- No selected baby: Hero exits safely without combining records from different babies.
- Newborn/no activities: neutral status, localized no-data values and no invented next feeding/diaper time.
- One bottle only: today's feeding count and bottle average use the real record; a future estimate appears only after enough real intervals exist.
- Completed breastfeeding uses its real activity data; an active breastfeeding session is indicated but is not counted as completed history.
- Active/paused sleep: greeting and current duration update live, while historical analysis remains memoized.
- Multiple babies: switch selection and confirm every sleep, feeding, diaper, health and reminder value switches immediately.

## Analysis priority

- Due medication reminder wins over sleep, feeding and diaper insights.
- Approaching/overdue sleep wins over feeding and diaper.
- Long feeding interval wins over diaper.
- Long diaper interval wins over positive reinforcement.
- With no attention/critical signal, exactly one positive routine insight is shown.

## Metrics and trends

- Today's sleep matches the Today Statistics snapshot and includes correctly segmented overnight sleep and pauses.
- Today's feedings show completed breastfeeding/bottle records only and the real bottle average.
- Today's diaper count and wet/dirty/mixed detail match Statistics.
- Current wake time starts at the latest completed sleep end; active sleep uses the timer's paused-duration-aware value.
- Next nap comes from the existing prediction and remains Premium; next feeding/diaper appear only when real intervals can be derived.
- Trend labels compare today with the preceding buckets of the rolling seven-day snapshot.

## Performance and UI

- Leave Dashboard open for two minutes: countdown/duration values tick each second, but historical analysis changes only on minute boundary or source-store mutation.
- Add/edit/delete activity or reminder and verify analysis updates without refresh.
- Check Free/Premium, Bulgarian/English, Light/Dark/System and widths 375px, 768px, 1024px and 1440px.
- Run `npm run lint`, `npm run build`, then `npm run dev`.
