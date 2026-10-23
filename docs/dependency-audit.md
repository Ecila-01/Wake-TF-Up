# Dependency audit — 2026-10-23

The initial repository cleanup applied compatible npm audit fixes and upgraded the
development-only icon renderer to sharp 0.35.5. No forced Expo/React Native major
version change was applied.

After these fixes, `npm audit` reports **24 high**, **0 critical**, **0 moderate**,
and **0 low** advisories. These counts include dependent packages as well as the
underlying affected packages; they are not 24 separate application defects.

Remaining affected packages include braces, image-size, node-forge, postcss, and
ws in the Expo/React Native dependency tree. Review their advisories and compatible
patch paths before a wider public distribution. `npm audit fix --force` currently
suggests incompatible framework changes, including an Expo downgrade; it was not run.

The release APK has no Internet permission. That does not eliminate supply-chain
or development-tool risk, and this audit is not a security certification. Re-run
the audit when preparing a release; registry results change over time.
