# Wake TF Up ⏰

An offline Android alarm clock that gets you out of bed. Place your wake-up QR away from your bed and scan it to stop the alarm.

- QR challenges or standard alarms with dismiss and snooze.
- Repeat schedules, ten built-in sounds, and your own imported audio.
- Light and dark themes. No account or internet required.

## Installation

Download the APK from [Releases](https://github.com/Ecila-01/Wake-TF-Up/releases).

## Run locally

Requires Node.js 22+, JDK 17, and Android Studio with a running emulator or connected Android phone.

```sh
npm ci
npm run android
```

For a browser design preview, run `npm run web`. Real alarms require Android; Expo Go is not supported.

For APK builds, see the [release guide](docs/public-release.md). Sound and icon credits are in [Third-party notices](THIRD_PARTY_NOTICES.md).
