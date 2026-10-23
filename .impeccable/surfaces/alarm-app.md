# Wake TF Up alarm app

Mode: Operate. Platform: Android; browser is a design preview only.

## Approved direction
The user selected **Familiar Android — light and indigo** from the mockups on 2026-10-23, then named Apple Clock as a familiarity reference. Approval is the explicit reply to “Which mockup should I build?” The selected reference is `.impeccable/mocks/decision/canon.png`. Preserve its light surfaces, indigo actions, rounded Material controls, time-first alarm summary, QR status, named alarm rows, anchored Add alarm, and labeled three-destination navigation.

## Direction contract
- Product mechanism: QR alarms require getting to a saved matching code to dismiss. Standard dismissal remains selectable.
- First viewport: the real next occurrence is the largest time; QR preparation is directly below it; enabled alarm rows follow. No promotional headline.
- Signature interaction: opening QR preparation from the editor keeps the alarm draft intact, then returns to it after explicit preparation.
- Palette: near-white `#F9F9FC`, white surfaces, indigo `#425BDD`, lavender container `#ECEEFE`, charcoal `#22232B`; paired dark scheme remains available.
- Type: familiar native sans with tabular clock numerals, functional body labels, and a restrained Material scale. Apple Clock is a usability reference, not permission to replace Android platform behavior.
- Shapes: 16dp panels, rounded filled/tonal buttons, 48dp minimum control targets.
- Motion: immediate state changes and system press feedback. No entrance choreography; reduced-motion users receive the same interface.
- Adaptation: center the phone-width interface in the browser; wrap days and clock lines at narrow widths; use safe-area and keyboard insets on Android; scroll the ringing screen at short heights and large type.
- States: persistent load-error retry, preserved save failures, explicit preview success feedback, camera-denied Settings recovery, mismatch scan retry, prepared/not-prepared QR, standard/QR ringing, and empty/off alarm states.
- Product truth beats decorative mockup data. Render saved alarms, not sample values; remove the mockup's redundant next-summary switch. Preview labeling remains visible. A generated QR illustration is never used as an actual scannable code.

## Verification limits
Browser captures demonstrate React Native Web UI only. Native compilation has passed; native alarm delivery, lock-screen behavior, camera permission flows, audio imports, and physical QR scans still require device validation. See docs/verification.md.
