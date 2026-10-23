# Wake TF Up

An Android alarm app built around a wake-up QR you place away from bed. Scan the matching code to dismiss a QR alarm, or choose Standard for a dismiss button and five-minute snooze.

## Preview the design first

Requires Node.js 22 or newer.

```powershell
cd C:\Users\ecila\Downloads\projects\Wake-TF-Up
npm ci
npm run web
```

Open the localhost address printed by Expo. The browser preview supports creating, editing, enabling, disabling, and deleting alarms, repeat days, themes, and QR downloads. Settings has previews of both ringing screens. Browser data stays separate from the Android install. It does **not** schedule or ring real alarms.

## Run on an Android emulator

1. Install [Android Studio](https://developer.android.com/studio), its Android SDK, and an Android emulator image. Use the JDK supported by this Expo/React Native build (JDK 17).
2. Use JDK 17. On Windows the launcher detects the SDK at `%LOCALAPPDATA%\Android\Sdk` and a compatible Java installation from `JAVA_HOME`, a local `.tools/java17/` folder, or Android Studio. Set `ANDROID_HOME` if your SDK lives elsewhere. Android Studio's Java 25 requires a newer Gradle version than this project uses.
3. In Android Studio, open **Device Manager**, create a virtual phone, and start it.
4. Run `npm ci`, then `npm run android` from this directory. The first run compiles and installs a debug build; no release APK is needed.
5. For later sessions, run `npm run android` again. It reuses build outputs and an existing Expo server when available. JavaScript changes reload; Kotlin or manifest changes require rebuilding.

The Windows launcher ignores offline emulators and builds directly with Gradle to avoid Expo hanging while querying a stale emulator. If multiple ready devices are connected, choose one with `npm run android -- --device emulator-5556` (replace the ID with one printed by `adb devices`). Use `--no-bundler` only when an Expo server is already running on port 8081.

Expo Go cannot run the custom Kotlin alarm module. Use the emulator or a USB-connected Android phone with USB debugging enabled. QR testing works best on a real phone; an emulator needs a configured camera source. iOS alarm scheduling is not implemented; unsupported platforms show the design preview.

## What is implemented

- Multiple saved alarms with names, enable switches, edit/delete controls, and repeat weekdays.
- Android `AlarmManager.setAlarmClock` schedules each enabled alarm independently of React Native.
- Native preferences own alarm configuration and active ringing state.
- Ten selectable CC0 alarm sounds are bundled in the APK and loop on the alarm audio stream. Each alarm saves its own choice; existing alarms default to Digital Beep. Sound sources and license records are in `assets/sounds/catalog.json`.
- Import audio from the device (up to 25 MB per file), validate it, and keep a private copy in app storage. Imported sounds remain available offline across restarts and can be reused by multiple alarms. If a saved file becomes unavailable, ringing falls back to bundled Digital Beep.
- Five-second previews stop when leaving the sound picker, backgrounding the app, or starting a real alarm. Browser previews use browser media volume; Android uses alarm volume.
- Standalone release builds exclude the Internet permission. Scheduling, QR checks, built-in sounds, and imported files require no server or account. The debug build uses the local development server.
- A notification opens the ringing screen; full-screen alerts depend on Android permission and system behavior.
- Standard alarms support dismiss and five-minute snooze. QR alarms verify the saved token natively and have no snooze.
- Future alarms restore after reboot, app updates, time/timezone changes, and reopening the app. Missed one-shot alarms are disabled during restoration; repeating alarms advance to their next occurrence.
- QR export and scanning, including retrying the same QR, plus saved light/dark appearance.
- QR-first setup with placement confirmation before enabling new QR alarms. Setup from the alarm editor preserves the draft; standard dismissal is always selectable.
- A light-and-indigo interface with paired dark appearance, labeled Alarms / Wake-up QR / Settings navigation, and safe-area-aware layouts.
- Save feedback, load retry, camera-denied recovery, and in-app discard/delete confirmations.

The design intent is recorded in `PRODUCT.md`, `DESIGN.md`, and `.impeccable/surfaces/alarm-app.md`. The initial UX review is in `docs/ux-review.md`; tested behavior and native verification limits are in `docs/verification.md`.

Wake TF Up 1.0.0 uses Android application ID `com.ecila.waketfup` and Expo slug `wake-tf-up`. It installs separately from the original app, with independent alarm data and QR setup. No cloud build or EAS project is linked.

## Device validation before release

Run the JavaScript checks with `npm test`, and verify the bundle with `npx expo export --platform android`.

The native implementation must be built and tested on Android before release:

- Grant precise alarms, notifications, and lock-screen popups from Settings.
- Set alarms one or two minutes ahead; test with the app foregrounded, backgrounded, and the screen locked.
- Confirm two alarms coexist and cancelling/disabling one leaves the other scheduled.
- Test standard dismissal, snoozing, and a QR alarm with wrong/correct/repeated QR scans.
- Reboot with a future alarm scheduled, unlock once, and verify it still rings.
- Check the device's alarm volume and test a repeating alarm on more than one day.

The phone must remain powered on. Force-stopping the app prevents delivery until reopening it. Device vendors, user-controlled alarm volume, notification settings, and Do Not Disturb policies can affect behavior. A web preview does not validate these.

Keep the checked-in `android/` project: custom native alarm code lives there. Do not regenerate it with `expo prebuild --clean` unless you first preserve those customizations. Public releases require private signing. Run `npm run release:setup` once for a new key, or restore your existing signing files. Release builds refuse to use debug signing. See [the public release instructions](docs/public-release.md) for backup, build, upgrade compatibility, and GitHub release steps.
