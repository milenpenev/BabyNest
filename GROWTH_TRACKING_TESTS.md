# Growth Tracking v1 verification

1. With baby A selected and no growth records, `/growth` shows empty latest cards, per-chart empty states, and an enabled add form.
2. Add `6.2 kg` only. Expected stored value: `weightKg: 6.2`; height and head circumference are absent, not zero.
3. Add height only in a separate record. Expected: latest weight remains 6.2 kg while latest height comes from the newer height record.
4. Add all three metrics at the same timestamp as another record. Expected: stable unique chart keys and no duplicate-key warning.
5. Enter invalid, negative, zero, overly large, or future values. Expected: save rejected with a localized technical validation error.
6. Add a historical record and note. Expected: reverse chronological history, note preview, and Timeline entry.
7. Open history/Timeline record, edit it in ActivityDetailsDrawer, then delete it. Expected: latest cards, charts, history, Statistics, Dashboard and Doctor Report update immediately.
8. Switch kg → lb and cm → in. Expected: display and edit inputs convert; stored kg/cm values remain unchanged. Switch repeatedly and verify no conversion drift.
9. Select 1 month, 3 months, 6 months and All. Expected: charts, visible history, insights and count share the same local-calendar period.
10. Verify weight, height and head charts independently with zero, one, identical and multiple values. Expected: no NaN domain, visible one-point dot, and no zero baseline flattening.
11. Free: add/edit/delete/latest/history remain available; charts and insights show PremiumGate. Premium: charts and deterministic insights are available.
12. Statistics: selected period shows count, latest per metric, change only with two relevant values, and days since latest.
13. Doctor Report: Growth checked includes unit-aware latest values, changes and period history; unchecked omits the entire section.
14. Switch babies. Expected: no record, chart, Timeline item, statistic or report value leaks between babies.
15. Verify Bulgarian/English, light/dark/system, and widths 375/768/1024/1440 without horizontal scrolling.

Insights describe recorded data only and are not medical assessments.
