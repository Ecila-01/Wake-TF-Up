# Wake TF Up

<!-- impeccable:product-schema 1 -->

## Platform
android

## Users
People setting everyday alarms, with an optional QR challenge to make them leave bed before dismissal. Sleepiness, one-handed use, and low light are working design assumptions, not research findings.

## Product Purpose
A general offline Android alarm app. The QR challenge leads the experience, with standard dismissal available per alarm. Help someone prepare their QR, set an alarm, understand when it will ring, and dismiss it using the method they deliberately selected.

## Operating Context
Android is the functional target. A React Native Web preview allows interface review without an emulator; it cannot validate real alarm delivery, notifications, sound, or camera behavior. Local Android compilation has passed; the release verification checklist records remaining device checks.

## Capabilities and Constraints
- Expo/React Native interface with a custom Kotlin alarm module.
- Standard and QR dismissal selectable per alarm; standard alarms allow five-minute snooze, QR alarms do not.
- Multiple alarms, day repeats, native saved schedules, and restoration receivers exist in the code.
- QR tokens belong to each installation. Users must keep the matching code accessible away from bed.
- Android permissions, alarm volume, and device policies affect operation. Do not imply tested reliability from a browser preview.
- No accounts, subscriptions, analytics, or server are part of the current product.
- New release identity: `com.ecila.waketfup`, version 1.0.0. No EAS project is linked.
- Ten bundled CC0 alarm sounds and private local audio imports. Release builds have no Internet permission.

## Brand Commitments
The user chose the name **Wake TF Up**, a QR-first experience with standard alarms still available, and the **Familiar Android — light and indigo** mockup. Apple Clock is the user's familiarity reference: prioritize straightforward time-first lists and uncluttered editing while retaining Android navigation, Back behavior, insets, and permission handling. The selected app icon is Lucide's existing alarm-clock outline, colored indigo; retain its ISC license notice. Do not generate a replacement illustration.

## Evidence on Hand
The repository, browser interaction checks, scheduling helper tests, audio integrity checks, and native compilation checks. Physical-device alarm reliability remains unverified. No user research or usage metrics exist.

## Product Principles
1. Put alarm times, enabled state, and next occurrence before promotional copy.
2. Make QR requirements visible before someone relies on a QR alarm.
3. Keep settings and recovery paths understandable, with drafts preserved on interruption.
4. Clearly distinguish design previews from real scheduled alarms.
5. Respect the selected dismissal method; do not introduce hidden bypasses or stricter defaults.
