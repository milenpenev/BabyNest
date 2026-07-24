# Native mobile experience verification

## Automated build gates

- `npm run build` validates TypeScript and the production web bundle.
- `npx cap sync` validates native plugin configuration and copies the production bundle.
- `hapticsEnabled` normalizes to `false` unless the persisted/imported value is explicitly `true`.
- The haptics service checks both the Capacitor runtime and the setting before every plugin call.

## Web regression matrix

- Browser uses `WebAppLayout`; Header, Sidebar and desktop drawers remain unchanged.
- No bottom navigation, native header, native sheets, status-bar calls or haptics appear in a browser.
- Existing routes, authentication, cloud sync, Premium gates and stores remain shared.

## Native matrix

- Fresh/migrated/reset settings: haptics switch is OFF.
- Header respects top safe area; bottom navigation respects bottom safe area.
- Home, Timeline and Insights reflect the active route.
- Quick Add and More close with backdrop, close button and Escape.
- Keyboard hides bottom navigation and restores it on close.
- Background/resume and offline/reconnect listeners are registered once and removed on unmount.
- Status-bar icons follow light/dark/system appearance.
- Activity details use bottom-sheet presentation while retaining the existing editor.
- Enabling haptics gives one preview; disabling produces no feedback.
- Timer ticks, scrolling, route render, charts, passive refresh and background sync never vibrate.

## Platform limitations

- iOS is present and can be validated through Xcode/device builds.
- Android is not currently added to this repository. Run `npx cap add android` only after the Android SDK/project is intentionally introduced, then execute this same matrix in Android Studio.
- Capacitor's native launch screen remains the existing offline-safe bundled splash; cloud sync is not awaited.
