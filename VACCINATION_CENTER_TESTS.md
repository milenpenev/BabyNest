# Vaccination Center verification

1. Create a baby with a valid birthday. Expected: one BG-2026 schedule is generated with dates derived from that birthday; refresh keeps the same records without duplicates.
2. Switch between two babies. Expected: timeline, counts and details contain only the selected baby’s records.
3. Verify birth, 6/10/14-week, 7/12/13/16-month and later childhood milestones use calendar date arithmetic.
4. Mark a vaccine completed and enter administered date, manufacturer, batch, doctor, clinic, reaction and notes. Expected: values persist after refresh.
5. Change status to postponed and skipped. Expected: localized status badges; neither is counted as completed or overdue.
6. Delete completion details. Expected: milestone returns to upcoming and optional administration fields are cleared.
7. For a future upcoming milestone, verify local one-time reminders exist 7 days before, 1 day before and on the due date. Past trigger times must not be created.
8. Free: timeline and editing work; statistics remain behind PremiumGate. Premium: statistics are visible.
9. Doctor Report: completed vaccinations with administered dates inside the selected report range are included when checked and omitted when unchecked.
10. Verify Bulgarian/English and light/dark/system themes at 375, 768, 1024 and 1440 px.
11. Verify conditional BCG entries and all due dates are presented as informational and accompanied by the pediatrician confirmation disclaimer.

Schedule source: Bulgarian Ministry of Health’s Plus Men calendar for 2026. No medical assessment is performed.
