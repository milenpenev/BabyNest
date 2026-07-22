# Reminders & Notifications v1 verification

## Scheduling contracts

- Interval: created at `2026-07-22T09:00`, 180 minutes → next trigger `12:00`. After a trigger at `12:01`, advance once to the first future interval and never emit catch-up duplicates.
- Daily: at 08:00 with current local time 07:00 → today 08:00; with current time 09:00 → tomorrow 08:00.
- One-time: valid future timestamp triggers once, becomes disabled and has no next trigger.
- Invalid persisted schedules, missing IDs/babies/titles and duplicate IDs are rejected or ignored safely.
- Feeding activity-aware: latest selected-baby bottle/breastfeeding timestamp is the interval anchor. Other babies and historical filters do not affect it.
- Diaper activity-aware: latest valid selected-baby diaper timestamp is the interval anchor.

## Page `/reminders`

- Test no babies, one baby, multiple babies and a deleted baby.
- Create interval feeding, daily medicine and one-time custom reminders; verify inline validation for empty title, non-positive interval, missing time and past/invalid date.
- Open every preset and confirm it only pre-fills the form; nothing is saved until Save is pressed.
- Edit, disable/enable and delete a reminder while the scheduler is active.
- Verify upcoming sorting, scheduled local time, overdue treatment, selected baby, muted category state and recent history capped at 50.
- Clear history and confirm reminders remain intact.

## Browser notifications

- Confirm no permission prompt occurs on page/app load.
- Test `default`, `granted`, `denied` and unsupported browser states.
- After denial, pressing the UI cannot repeatedly invoke the browser prompt.
- Refresh before a trigger, reopen after a missed trigger, set the system clock forward/back and confirm at most one event per scheduler tick/reminder.
- Disable sleep/feeding/diaper/medicine in Settings: reminder remains stored but browser notification is muted and recorded as missed.
- Confirm notification payload excludes the private note.

## Free, Premium, themes and navigation

- Free: interval/daily/one-time management and local notifications work; activity-aware checkbox is disabled and advanced section uses `PremiumGate` linking to `/plans`.
- Premium: activity-aware feeding/diaper anchors can be enabled and advanced section has no overlay.
- Verify Dashboard upcoming card, `/reminders` Sidebar route, active state and overdue badge.
- Test Bulgarian/English and Light/Dark/System at 375px, 768px, 1024px and 1440px.

## Regression and commands

- Smoke-test Dashboard, Sleep, Feeding, Health, Growth, Statistics, Timeline, Plans and Settings.
- Run `npm run lint`, `npm run build`, then `npm run dev`.
