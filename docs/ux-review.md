# Wake TF Up — UX review

Scope: code inspection and browser walkthrough of the current home, editor, QR setup, settings, and ringing preview. This is a heuristic evaluation, not user research or Android device validation.

## Findings and implementation order

| Priority | Evidence and user impact | Heuristic | Treatment |
| --- | --- | --- | --- |
| P1 | The editor can enable a QR alarm with no matching-code setup or placement confirmation. A person may discover the prerequisite while the alarm rings. | H5 Error prevention; H10 Help | Journey/Fortify: put QR setup in the editor, preserve the draft, require explicit preparation before enabling QR mode. |
| P1 | Initialization errors leave `ready` false and Add alarm disabled with no retry. | H9 Recovery | Fortify: persistent load error with retry; preserve loaded alarms on refresh failure. |
| P2 | QR setup is buried among general settings; the user explicitly wants it to lead. | H6 Recognition; H7 Efficiency | Organize: a named Wake-up QR destination and a direct setup action. |
| P2 | Home spends the first screen on promotional copy and a duplicate next-time card before reaching the actionable list. | H8 Minimalism | Impeccable: a compact next-alarm readout, visible list, anchored Add alarm. |
| P2 | Saving closes the editor with no explicit confirmation of the actual next occurrence; snoozed times can use the original AM/PM label. | H1 Status | Fortify: confirmation using the saved schedule and timestamp-derived clock labels. |
| P2 | Camera denial only offers another permission request, even when the OS won't ask again. Scan retries need a synchronous lock. | H9 Recovery | Fortify: Open settings recovery, local mismatch/error feedback, a retry that resets all scan guards. |
| P2 | Day chips shrink below 48dp; large text and short windows can clip a centered ringing layout. | H4 Standards | Include/Impeccable: wrapping controls, minimum targets, scrollable ringing screen, safe-area and keyboard insets. |
| P2 | Leaving a modified editor silently discards a draft; Back from settings can leave the app. | H3 Control | Journey: explicit discard choice and proper system Back handling. |

## Protect

Keep native scheduling, the enabled switch, concise repeat labels, independent standard/QR dismissal modes, explicit browser-preview labeling, and existing saved alarms. Do not claim a scan can prove the printed code's physical location. Preparation is a user attestation; an optional native test scan confirms only token matching.

## Success checks

- A new user can locate and prepare their QR without entering unrelated settings.
- Enabling a QR alarm explains and checks preparation, without losing time/name/repeat edits.
- Standard mode remains directly selectable.
- Saving reports the next scheduled date/time; failed saves preserve edits.
- Loading, camera-denied, mismatch, empty, disabled, and long-label states have a recovery path.
- The browser preview remains clearly distinct from Android alarm verification.
