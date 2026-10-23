# Build an APK

Requires Node.js 22+, JDK 17, and the Android SDK. Run from the project folder:

```sh
npm ci
npm test
npm run release:setup
```

The last command creates private signing files in `.signing/`. Back up that folder
securely: future updates need the same key. Never commit or upload it.

With `JAVA_HOME` pointing to JDK 17 and `ANDROID_HOME` to your SDK:

```powershell
$env:NODE_ENV = 'production'
.\android\gradlew.bat -p android :app:assembleRelease --max-workers=4
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.

The checked-in `android/` folder contains the custom alarm module. Do not replace
it with `expo prebuild --clean`.

## Before publishing

Test scheduling, locked/background ringing, reboot recovery, snooze, QR dismissal,
and imported audio on a real phone, including airplane mode. Android permissions,
alarm volume, and device policies affect delivery. Force-stopping the app prevents
alarms until it is reopened.

Run `npm audit` and review advisories before wider distribution. The last audit
reported 24 high advisories in the Expo/React Native dependency tree; compatible
fixes were applied, but no forced framework downgrade or major upgrade was used.

Attach the signed APK to a GitHub release. Increase Android versionCode for each
new build distributed to users. This replacement 1.0.0 uses versionCode 2.
