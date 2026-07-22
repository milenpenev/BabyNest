# Statistics bug-fix verification

Use a fixed local reference time when preparing records so expected period boundaries are unambiguous.

## Translation and themes

- Switch English/Bulgarian on Statistics and confirm the diaper total, chart, empty states, interval labels, and both insight group labels are translated (no raw keys).
- Check Light, Dark, and System themes. Cards, chart containers, legends, axes/labels, empty states, and insight rows must remain readable.

## Period and diaper insight contracts

- With Today selected and a diaper earlier today, the live insight uses the latest diaper for the selected baby.
- With a historical range that does not include the current instant, no live `time since last diaper` insight is shown.
- Records for another baby never affect the selected baby's live insight.
- Future-dated records are ignored by the live insight.
- In a period containing 0 or 1 diaper records, average and longest intervals show no-data state.
- For consecutive records at 08:00, 10:00, and 15:00, average interval is 3h 30m and longest is 5h. No interval may cross the selected period boundary.

## Chart contracts

- Today, 7 days, and 30 days render exactly 1, 7, and 30 chronological buckets, including empty days.
- Sleep rows use `daySleepMinutes` and `nightSleepMinutes`; feeding rows use `breastfeedingMinutes`, `bottleMl`, and `feedingCount`; diaper rows use `wet`, `dirty`, `mixed`, and `total`.
- Test no records, records whose measured values are all zero, exactly one non-zero point, and multiple points.
- Verify overnight sleep is split across both local calendar days in the sleep chart.
- Confirm duration tooltips use hours/minutes, bottle values use ml, and count charts show counts.

## Regression smoke test

- Change period tabs repeatedly and confirm all totals, charts, and historical insights update immediately.
- Add/edit/delete an activity and confirm Statistics updates without reload.
- Run `npm run lint` and `npm run build`.
