# Milestones and local Coach verification

## Reused architecture

- Baby identity and gestational week come from `babyStore`; milestone age delegates to the existing chronological and corrected-age utilities.
- Timeline integration reads the persisted milestone store without changing the existing activity union.
- Sleep and routine Coach rules reuse sleep prediction and next-feeding/diaper status utilities.
- Vaccinations, reminders, subscription state, Doctor Report, data transfer, routing and i18n remain their existing stores/contracts.

## Automated checks

- `npm run validate:milestones`: unique catalog IDs, valid age-window ordering, catalog versions, known sources and BG/EN title keys.
- `npm run build`: TypeScript project build and production Vite bundle.

## Manual matrix

1. Open `/milestones` with no observations; confirm neutral empty copy and age-appropriate bands.
2. Check 375, 768 and 1024 px plus desktop in light, dark and system themes.
3. Mark a catalog item emerging, then observed; add valid dates and a note.
4. Confirm future dates and reversed first-noticed/observed dates are rejected.
5. Add and edit a custom milestone; verify a title is required.
6. Mark a parent concern; confirm neutral pediatrician copy and Doctor Report opt-in.
7. Select the observation date in Dashboard Timeline; confirm the item opens `/milestones` and edits/deletion update immediately.
8. Switch babies and verify records remain isolated.
9. Use a premature profile: confirm both ages, corrected default through the documented 24-month product cutoff, and manual age-mode switching.
10. Export, clear and import valid data; verify catalog version and custom/concern records. Corrupt one record and confirm the whole import is rejected.
11. Enable Milestones in Doctor Report; confirm only dated, selected-period records are included and unrecorded catalog items are absent.
12. Switch BG/EN and inspect all Milestones, Timeline, Statistics, Report and Coach text.
13. Coach with no data: confirm neutral setup insight and visible explanation.
14. Start sleep: confirm active-sleep insight replaces nap timing.
15. Create feeding/diaper history near or beyond configured intervals; confirm deterministic insight and evidence.
16. Make a medicine reminder due: confirm it is primary. Make a vaccination due/review item: confirm its priority.
17. Add growth, emerging milestone, observed milestone and parent concern; confirm relevant neutral insights.
18. Dismiss an insight and refresh; confirm it stays hidden. Snooze another and confirm persistence.
19. Change evidence identity (new reminder time or record) and confirm the new insight can appear.
20. Free plan shows one insight; Premium shows up to three.
21. Inspect browser console for duplicate keys, missing translations, store-loop warnings and stale/duplicate Timeline rows.

## Safety expectations

- No pass/fail score, developmental-risk percentage, diagnosis, or normal/abnormal classification appears.
- Custom milestones do not affect catalog progress.
- Coach output is translation-key based, deterministic, local and accompanied by record evidence and a non-medical disclaimer.
