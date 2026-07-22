# Country-aware Vaccination Center verification

1. Import/migrate an old baby without `vaccinationProfile`. Expected: `{countryCode:"BG", scheduleVersion:"BG-2026", source:"migration"}` and existing vaccination records gain generated provenance without losing details.
2. Register baby A with BG. Expected: profile source `registration`; BG schedule generated only after the baby is saved.
3. Register baby B with Other. Expected: no generated BG entries, a neutral unavailable message, and manual entry controls.
4. Add a manual record for baby B. Expected: `recordOrigin:"manual"`, schedule version `MANUAL`, persistence after refresh, and Doctor Report support.
5. Complete BG dose with manufacturer, batch, doctor, clinic, reaction and notes. Change to Other. Expected: completed record and every field preserved; untouched generated plans removed.
6. Change back to BG. Expected: fresh planned entries, completed matching code+dose satisfies the corresponding plan, no duplicate completed record.
7. Preserve postponed/skipped records with user data during both changes.
8. For an unknown completed generated code, expected: preserved record plus a neutral review conflict; dismiss keeps the record.
9. Verify reminder IDs use vaccination record IDs. After reconciliation, removed planned reminders disappear, reminder history remains, and new schedule reminders are created once.
10. Birthday Jan 31 + one month should clamp to Feb 28/29. Leap-day and month/year offsets must not shift a day through UTC.
11. Simulate an older schedule version. Expected: no automatic record replacement; country/profile version remains persisted until review/apply.
12. Export and import babies, vaccination records, provenance and conflicts. Malformed profiles or vaccination records must reject the complete import.
13. Doctor Report shows current country/version and original country/version/origin for completed history.
14. Switch language independently of country and switch between babies repeatedly. Expected: no inferred country and no cross-baby records.
15. Verify light/dark/system at 375/768/1024/desktop and keyboard access to selectors and confirmation controls.
