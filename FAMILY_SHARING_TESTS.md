# Family Sharing verification

## Manual matrix

1. Free plan: `/family` shows the single local owner; multi-member UI is Premium-gated.
2. Premium owner: rename family, generate an invite, copy its link, revoke another invite and accept a valid code locally.
3. Create Parent, Grandparent, Doctor and Viewer members; inspect capability chips against the centralized role map.
4. Use “Test as family member” and verify Viewer cannot create/edit/delete activities, manage babies, milestones or vaccinations.
5. Verify Parent can manage care data but cannot manage the Premium owner; Doctor can export reports and view health but cannot edit care records.
6. Add bottle/sleep/growth activities as different members. Confirm Timeline avatar/name attribution and All/Only me/member filters.
7. Edit an activity as another member; confirm created-by and edited-by are both visible.
8. Create, update and delete activities/milestones; update vaccination completion; confirm who/what/when entries on Family audit history.
9. Toggle each member's feeding, medication, vaccination and sleep preferences; verify disabled categories are not routed to that current local member.
10. Refresh and confirm family, invitations, current user, preferences, attribution and audit persist offline.
11. Test BG/EN, light/dark/system, 375px, 768px, 1024px and desktop.
12. Run `npm run build` and inspect the browser console for key, store-loop and translation warnings.

## Cloud adapter checks for a later backend

- Implement `IdentityProvider`, `FamilyRepository` and `FamilySyncAdapter`; UI/store consumers require no provider-specific imports.
- Preserve stable family/member/entity IDs, attribution fields and audit timestamps.
- Supply a deterministic conflict resolver before enabling real-time writes.
