# Baby routine and DashboardHero verification

Manual checks for each baby and in Bulgarian and English:

- New baby: answer the feeding and diaper routine questions; confirm the values appear in Baby Profile.
- Existing baby: confirm the setup prompt appears once, values save, and remain after reload.
- Set feeding to 180 minutes, log a feeding at 08:00, and confirm DashboardHero shows `In 3 h` at 08:00 and decreases with time.
- Advance beyond the configured interval and confirm Hero says `Overdue by …`, never a positive countdown.
- Repeat for a diaper record and its configured diaper interval.
- Enable adaptive mode with fewer than four valid records; confirm the configured interval remains the fallback.
- Add enough regular records; confirm adaptive mode uses history and ignores gaps below 15 minutes or above 12 hours.
- Switch between two babies with different intervals; confirm cards and reminders use the selected baby’s data only.
- Edit or delete the latest relevant activity; confirm Hero and activity-aware reminders recalculate without refresh.
- Verify light, dark, and system themes on DashboardHero, Baby Profile, the routine questionnaire, and reminders.
- Confirm invalid values below 15 or above 1440 minutes are rejected.

These routine estimates are convenience settings and are not medical advice.
