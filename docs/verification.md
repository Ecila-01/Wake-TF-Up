# Interface verification — 2026-10-23

Scope: user-selected Familiar Android light/indigo design, with Apple Clock as a familiarity reference. QR challenge leads; Standard remains selectable. Evidence was captured from React Native Web, not an Android emulator.

Repository cleanup: the new project uses `com.ecila.waketfup` and the selected
Lucide alarm-clock icon. Package renaming has passed Gradle configuration checks;
a new APK has deliberately not been built. Earlier native compilation evidence
below predates the package rename. See `docs/dependency-audit.md` for remaining
dependency advisories.

The fresh repository passes all 16 JavaScript tests, icon generation, web
production export, and Android JavaScript/Hermes export. The icon is sourced from Lucide and its notice is bundled in
Android assets. Private keys, local Java, build outputs, and audit logs are ignored.

## Passed

- `npm test`: all 16 tests passed, covering date rollover, repeat days, formatting, snoozed timestamp AM/PM, input validation, new-alarm dismissal defaults, offline device filtering, Java version detection, and integrity/license records for all ten bundled sounds.
- Expo web production export and Android JavaScript/Hermes export compile. These do not compile Kotlin or install an Android app.
- Browser walkthrough: invalid times cannot be submitted; new alarms start in QR mode; QR setup blocks enabling until the user explicitly confirms preparation; visiting setup preserves time, name, repeat days, and dismissal choice.
- Preparation state and alarms survive reload. Saving shows the actual next occurrence and clearly identifies preview saves.
- Existing alarms can switch to Standard; QR and Standard ringing previews work; simulated QR dismissal and snooze explicitly state that no real alarm was affected.
- In-app confirmations: Keep editing preserves the changed name; Discard changes restores the saved value; Escape cancels the delete dialog without closing the editor; confirmed deletion removed only the temporary test alarm.
- Light, dark, 390×844 phone preview, 320×640 narrow editor/dialog/ringing views, 1280×900 desktop preview, and the default 1280×720 browser view were inspected. Captures live locally in `.impeccable/review/` and are not application assets.
- Independent finish review: **ship at browser-preview scope**, with no material issue found in the reviewed source and supplied captures.
- Android native debug build: Gradle `:app:assembleDebug` succeeded with JDK 17 / SDK 36 / NDK 27.1 for x86_64; APK installation and activity launch succeeded on the Pixel 7 emulator (`emulator-5556`).
- Sound feature: native debug compilation passes with ten raw audio resources, custom-file import, preview methods, and per-alarm playback. The merged release manifest was checked and contains neither INTERNET nor ACCESS_NETWORK_STATE permission. The old song was removed.
- Browser sound walkthrough: all ten options appear; changing the sound updates selection; built-in and imported previews report no playback error; a local MP3 imports and becomes selected; saving then reloading preserves the imported sound and library entry; importing a JSON file shows a recoverable unsupported-audio error and keeps the previous choice.

## Still required on Android

Android setup is now available: a local Temurin JDK 17, Android SDK 36, NDK 27.1, and the Pixel 7 emulator. The Windows launcher selects ready devices and bypasses Expo's stalled query of an offline emulator. System Back, font scaling, keyboard/system-bar insets, notification permissions, actual sound/volume, alarm delivery after backgrounding or reboot, lock-screen presentation, camera permission denial, and physical QR scans remain unverified. The Android checklist in the README must be completed before release.

The sound-feature check had no ready Android device (only an offline emulator). Native file-picker interaction, playback on the alarm stream, preview interruption, and fallback from a missing custom file still need device testing. Browser checks do not establish those behaviors.

The HTML/CSS design detector was not run because it does not validate React Native Android components. The browser is a design preview and cannot establish alarm reliability.
