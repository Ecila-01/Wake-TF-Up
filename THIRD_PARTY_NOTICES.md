# Third-party assets

## App icon

The app icon uses the existing **alarm-clock** SVG by Lucide Icons and Contributors.
The original SVG is retained in `assets/vendor/lucide-alarm-clock.svg`.
Source: https://github.com/lucide-icons/lucide/blob/main/icons/alarm-clock.svg

The ISC license and included upstream notices are retained in `licenses/LUCIDE.txt`
and bundled into the APK at `assets/licenses/LUCIDE.txt`.
Adaptations: indigo stroke, padding, light background, and Android density exports.
The icon geometry has not been redrawn. Regenerate with `npm run icons:generate`.

## Alarm recordings

The ten selected Freesound recordings are bundled as existing CC0 recordings.
See `assets/sounds/README.md` and `assets/sounds/catalog.json` for every creator,
source page, license URL, download URL, and checksum. No runtime download is used.

## Dependencies

JavaScript and native dependencies retain their own upstream licenses. The npm
lockfile records the installed versions. Dependencies and build caches are not
committed to this repository.

The Gradle wrapper is distributed under Apache License 2.0. A copy is retained in
`licenses/GRADLE-APACHE-2.0.txt`; the wrapper launchers also retain upstream notices.
