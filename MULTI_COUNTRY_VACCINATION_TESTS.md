# Multi-country vaccination verification

- Run `npm run validate:vaccination-schedules` and `npm run build`.
- Confirm all 15 supported countries plus unsupported/manual mode appear in registration and Baby Profile.
- Confirm Canada blocks confirmation until ON, QC, BC or AB is selected; compare at least ON and QC generated records.
- Create BG, DE, GB and US babies and confirm dates/items differ and persist after refresh.
- Complete a dose with manufacturer, batch, doctor, clinic, reaction and notes; change country/region; confirm every field and original provenance remains.
- Confirm only untouched future generated entries are replaced and ambiguous matches appear under Needs review.
- Confirm seasonal/risk-based items do not create automatic reminders and refresh does not duplicate reminders.
- Confirm official authority, version, verification date and link change immediately with the selected baby.
- Verify category/status filters, manual unsupported-country records, BG/EN, light/dark/system themes and Doctor Report output.
