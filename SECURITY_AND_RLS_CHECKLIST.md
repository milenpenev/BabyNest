# Security and RLS checklist

- [x] RLS enabled for every exposed user-data table.
- [x] Frontend uses only URL plus publishable key; no service-role secret exists in client files.
- [x] Profile access is restricted to `auth.uid()`.
- [x] Family reads require active membership.
- [x] Baby/activity reads require active family membership.
- [x] Baby and member writes require centralized SQL permission helpers.
- [x] Activity insert/update/delete permissions differ; Viewer and Doctor are read-only by default.
- [x] Baby/activity family relationship is checked on insert.
- [x] Audit log reads require family membership and writes occur through security-definer triggers.
- [x] Security-definer helpers use a fixed empty `search_path` and fully-qualified objects.
- [x] Attribution uses authenticated server identity in triggers where possible.
- [x] Soft deletes remain governed by update policies and retain tombstones.
- [x] Secure cloud invitation acceptance is deferred instead of trusting a frontend invite code.
- [ ] Before production, run User A/User B adversarial SQL/API tests against a staging project.
- [ ] Confirm Realtime publication/policies in the target project and inspect subscription errors.
- [ ] Configure allowed Auth redirect URLs and production Site URL.
- [ ] Enable appropriate password, email verification, rate-limit and breached-password settings.
- [ ] Implement protected ownership transfer/account-family deletion RPCs before exposing destructive buttons.
