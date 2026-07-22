# Settings and Baby Profile v1 — manual test matrix

## Baby profile

1. With no babies, open `/baby-profile`, open Add baby, validate required fields, and create the first profile.
2. Edit name, birthday, gestational week, sex, birth weight, birth height and notes; verify Save persists and Cancel discards edits.
3. Verify future birthdays, gestational weeks outside 22–42 and non-positive/excessive measurements show localized inline errors.
4. Verify chronological age never becomes negative. With no gestational week, verify the neutral corrected-age message; with a week, verify corrected age is non-negative.
5. Add a second baby and switch repeatedly in view and edit modes. Verify one baby's draft/data never overwrites the other.
6. Verify the last baby has no delete action. With two babies, verify deletion requires confirmation.
7. Add an activity for a baby and verify deletion is blocked with guidance to delete or export its records first.
8. Refresh and verify babies and `selectedBabyId` persist.

## Preferences and formatting

1. Switch BG/EN from Settings and Header, including while a modal is open; verify both controls stay synchronized and refresh preserves the language.
2. Switch 24h/12h and verify Settings preview, Dashboard clock/prediction, Timeline, activity drawer and Growth history.
3. Switch all three date formats and verify display-only dates exactly match the selected separators/order; HTML date inputs remain ISO-compatible.
4. Switch Monday/Sunday and verify the Statistics seven-day series begins on the chosen weekday without changing activity timestamps.
5. Switch kg/lb and cm/in repeatedly. Verify Baby Profile summaries, Growth cards, chart, history, quick-add and edit forms change display only.
6. Save Growth values entered in lb/in, switch back to kg/cm and verify the base values are correct with no cumulative conversion drift.
7. Switch light/dark/system and verify immediate application, refresh persistence and reaction to an OS theme change in system mode.
8. Toggle all six future-notification preferences and verify persistence; verify no browser permission prompt appears.
9. Verify the current Free/Premium+ plan and that Manage plan opens `/plans` without changing the plan.
10. Verify Developer tools appear only in a development build.

## Data and privacy

1. Export and verify JSON includes `schemaVersion`, `exportedAt`, settings, babies, `selectedBabyId`, activities, serializable timer metadata and subscription metadata.
2. Import a valid export, confirm replacement, and verify the UI updates immediately without refresh.
3. Cancel a valid import and verify no state changes.
4. Reject malformed JSON, unsupported schema versions, invalid settings, invalid babies/activities, duplicate IDs and activities referencing missing babies; verify no partial state changes.
5. Start Clear data, cancel the strong confirmation, then try an incorrect phrase; verify nothing is cleared.
6. Type `clear all`; verify only BabyNest keys are reset, unrelated localStorage entries survive, stores update immediately and defaults persist after refresh.

## Compatibility and regression

1. Exercise Dashboard, Sleep timer, feeding/bottle, diaper, bath, medicine, Timeline details/edit/delete, Growth, Statistics, Plans and PremiumGate.
2. Verify activities whose baby is missing do not crash profile, growth, dashboard or statistics views.
3. Seed invalid/old `babynest-settings` data and verify migration falls back field-by-field to valid defaults.
4. Run `npm run build` and verify TypeScript and the production bundle complete successfully.
