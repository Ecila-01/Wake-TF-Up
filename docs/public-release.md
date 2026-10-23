# Wake TF Up 1.0.0

This is the first public release of Wake TF Up in a new repository, not an update
release of the original joke app. Android version name: 1.0.0. Version code: 1.
Android application ID: `com.ecila.waketfup`. This fresh identity installs separately
from the old joke app. It uses its own alarm data, wake-up QR, and imported sounds.

## Signing setup (once)

If you already own a permanent signing key for this application, reuse it instead
of generating another key. Place your keystore and `release.properties` in the
ignored `.signing/` folder. Properties are `storeFile`, `storePassword`, `keyAlias`,
and `keyPassword`; a relative storeFile resolves from `.signing/`.

For a new signing identity, run from the project folder:

```powershell
npm run release:setup
```

The script creates a 3072-bit RSA key, a random password, and the local Gradle
credentials. It will not overwrite either file or build anything. Back up the
entire `.signing/` folder securely, outside the repository and this computer.
For direct APK distribution, future updates need the same signing key. The
password is stored locally in `.signing/release.properties`, not printed to the
terminal. Do not commit or publish the key or properties file.

For development installations with the same new application ID, a new release key
cannot update a debug-signed installation. Uninstall that development installation
before installing the release APK, then prepare a new QR and recreate its alarms.
The old app has a different package ID and does not need to be uninstalled.

## Build it yourself

```powershell
$env:JAVA_HOME = "$PWD\.tools\java17\jdk-17.0.20.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:NODE_ENV = "production"
.\android\gradlew.bat -p android :app:assembleRelease --max-workers=4
```

Wait for BUILD SUCCESSFUL. Output: `android/app/build/outputs/apk/release/app-release.apk`.
The command makes a standalone APK with all configured CPU architectures, bundled
JavaScript and audio, no Metro dependency, and no Internet permission. Release
tasks fail if private signing credentials are missing; debug signing is never used.

## GitHub release

Before tagging v1.0.0 in the new repository, test the signed APK on an Android phone in airplane mode:
schedule an alarm, background/lock the phone, confirm sound, standard dismissal,
snooze, QR dismissal, and playback of an imported file. Check the reboot case too.
Native sound import/playback has compiled but has not yet been tested on a device.

This repository starts with fresh Git history. Do not copy build outputs, private
signing files, development runtimes, or the old repository's `.git/` into it.

Commit and push the source to the new repository, create tag v1.0.0 there, and attach only the APK and optional
SHA-256 checksum to the release. Sound provenance ships in `assets/sounds/catalog.json`.
The APK is ignored by Git and belongs in release assets, not source history.

Google Play distribution is a separate process requiring an app bundle, Play App
Signing setup, listing/policy information, and review. This document targets a
direct APK release on GitHub.

The repository is private. Its GitHub releases are visible only to people who can
access it. To distribute an APK publicly, change repository visibility or use a
separate public distribution location deliberately.
