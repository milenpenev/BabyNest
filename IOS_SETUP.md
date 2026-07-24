# BabyNest iOS

The iOS application uses Capacitor 8 and the existing local-first React build.

## Commands

```bash
npm run ios:sync
npm run ios:open
```

In Xcode, select the `App` target, choose an Apple Development Team, verify the
bundle identifier `com.babynest.app`, select a simulator/device, and Run.

## Supabase authentication

Add these Redirect URLs in Supabase Authentication URL Configuration:

- `babynest://auth/callback`
- `babynest://auth/reset-password`

The `babynest` URL scheme is registered in `ios/App/App/Info.plist`.

## Release checklist

- Replace the generated AppIcon assets with final 1024×1024 BabyNest artwork.
- Configure Apple signing, version, build number, and App Store category.
- Add privacy-policy and support URLs in App Store Connect.
- Verify login, password reset, offline tracking, reconnect sync, dark mode,
  safe areas, file export, and background/foreground timer restoration on a
  physical iPhone.
- The development-only `/api/doctor-report` Python endpoint is not bundled in
  iOS. Move PDF generation to a hosted/Edge Function endpoint before release.
