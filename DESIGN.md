---
name: Wake TF Up
description: Familiar Android alarms with time-first clarity and a QR challenge.
colors:
  light-bg: "#F9F9FC"
  light-surface: "#FFFFFF"
  light-container: "#ECEEFE"
  light-primary: "#425BDD"
  light-on-primary: "#FFFFFF"
  light-text: "#22232B"
  light-muted: "#60616F"
  light-outline: "#DFE1EB"
  light-faint: "#F0F1F6"
  light-success: "#246336"
  light-success-bg: "#ECF5EF"
  light-error: "#A12732"
  light-error-bg: "#FFF0F0"
  dark-bg: "#15161D"
  dark-surface: "#20212B"
  dark-container: "#2A3157"
  dark-primary: "#B8C4FF"
  dark-on-primary: "#17296D"
  dark-text: "#F0F0FA"
  dark-muted: "#B5B7C9"
  dark-outline: "#40414F"
  dark-faint: "#272833"
  dark-success: "#9DD8AC"
  dark-success-bg: "#20392A"
  dark-error: "#FFB3BA"
  dark-error-bg: "#43282C"
typography:
  title:
    fontSize: "32px"
    lineHeight: "40px"
    fontWeight: 700
    letterSpacing: "-0.6px"
  section:
    fontSize: "20px"
    lineHeight: "28px"
    fontWeight: 600
  label:
    fontSize: "15px"
    lineHeight: "22px"
    fontWeight: 600
  body:
    fontSize: "15px"
    lineHeight: "23px"
  small:
    fontSize: "13px"
    lineHeight: "20px"
  time:
    fontSize: "64px"
    lineHeight: "76px"
    fontWeight: 400
    letterSpacing: "-1.5px"
rounded:
  field: "12px"
  panel: "16px"
  control: "24px"
  button: "28px"
spacing:
  tight: "4px"
  compact: "8px"
  control-gap: "12px"
  section: "16px"
  panel-inset: "18px"
  row-inset: "20px"
  page-inset: "24px"
components:
  button-filled:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.light-on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "14px 20px"
  button-tonal:
    backgroundColor: "{colors.light-container}"
    textColor: "{colors.light-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "14px 20px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.light-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "14px 20px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.light-error}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "14px 20px"
  alarm-card:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.panel}"
    padding: "20px"
  name-input:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "16px"
  day-selected:
    backgroundColor: "{colors.light-container}"
    textColor: "{colors.light-primary}"
    rounded: "{rounded.control}"
    size: "48px"
  day-unselected:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-muted}"
    rounded: "{rounded.control}"
    size: "48px"
---

# Design System: Wake TF Up

## Overview

**Creative North Star: "Familiar Android — light and indigo"**

Familiar Android — light and indigo is the approved visual direction. Clear native sans, large clock numerals, quiet surfaces, and rounded controls make the interface easy to scan while sleepy. Apple Clock informs time-first clarity and uncluttered editing; Android remains the authority for navigation, Back, insets, permissions, and control behavior.

The user-selected Lucide alarm-clock outline and Wake TF Up name identify the product. QR preparation leads the experience while standard dismissal remains an explicit per-alarm choice. Light is the default, with an intentionally paired dark appearance.

**Key Characteristics:**

- Time-first hierarchy with tabular clock numerals.
- Indigo actions, lavender emphasis, and restrained outlined panels.
- Rounded controls with generous touch targets.
- Immediate state changes without entrance choreography.

This is the implemented React Native Android system. Sources: `src/ui/theme.js`, `src/ui/controls.js`, `App.js`, and the editor, QR setup, and ringing screens in `src/ui/`. The approved direction is recorded in `.impeccable/surfaces/alarm-app.md`. Frontmatter px values represent React Native logical layout units (dp for geometry, scalable text units for typography), not physical device pixels. The native system font is inherited; no custom font family is declared.

## Colors

### Primary

Indigo signals primary actions, selected controls, navigation, and the alarm-clock mark. Lavender containers group high-priority time information and selected options. Use `light-primary`/`dark-primary`, their on-primary foregrounds, and the paired container roles.

### Neutral

Near-white canvas, white surface, charcoal text, muted supporting text, fine outlines, and faint backgrounds form the light system. The dark system pairs these roles with deep charcoal surfaces and pale text. Success green is reserved for prepared/allowed status; error red and its background identify failures. These are semantic statuses, not additional brand accents. Sidecar tonal ramps are synthesized palette previews, not runtime tokens; browser component specimens translate native dimensions and inherit a system sans.

**The Semantic Pairing Rule.** Use the same semantic color role in both appearances; do not transplant a light value into dark mode.

## Typography

Use the inherited native sans throughout. The frontmatter mirrors `TYPE` without inventing a font stack or a mathematical scale. `title` names pages; `section` names groups; `label` marks controls; `body` explains tasks; `small` supplies status and secondary detail. `time` is the next-alarm display.

Clock numerals use tabular figures. Alarm rows use a lighter clock at (42/52, weight 400, tracking −0.8); editor fields use (54, weight 400); ringing uses (76/90, weight 400, tracking −1.5). These are contextual variants, not replacements for the shared type roles.

**The Time First Rule.** Clock numerals carry the strongest hierarchy; supporting labels explain the time without competing with it.

## Layout

Use a centered single column with full available width and a maximum (480). Main page and editor insets use `page-inset`; sections and controls use the extracted spacing steps. The app bar has a minimum height (60). Main navigation has three labeled destinations: Alarms, Wake-up QR, Settings. Its items have a minimum height (64), and its bottom padding respects the safe-area inset with a floor (8). Add alarm stays below the scrolling list and above navigation.

Clock lines and repeat days wrap at narrow widths. Editor content scrolls and retains keyboard taps; ringing content grows and scrolls at short heights or large type. Use native safe areas and Android keyboard resizing. There are no breakpoint-specific layouts in these UI files.

## Elevation & Depth

**The Flat Surfaces Rule.** Use tonal containers and thin outlines for separation; the implemented UI has no decorative elevation shadows.

Panels use tonal fills or a single-unit outline. Confirmation dialogs use the actual translucent black scrim (`#00000066`), a centered surface, and a maximum width (360); there is no shadow token. Modals use `animationType="none"`. Button press feedback changes opacity immediately; there are no duration or easing tokens.

## Shapes

Panels and grouped settings use `panel`; fields and notices use `field`; filled and tonal buttons use `button`. Icon controls are circular (48 target, 24 radius). Repeat-day controls have minimum targets (48) and radius (24). Toggle tracks are (52 × 32, radius 18), inside a minimum target (64 × 48); thumbs are (24 × 24, radius 12). The navigation indicator is a short pill (64 × 32, radius 18).

## Components

### Buttons

Filled, tonal, text, and danger share centered label typography, optional icons, minimum height (52), and the frontmatter padding. Filled uses primary/on-primary; tonal uses container/primary; text uses transparent/primary; danger uses transparent/error. Pressed opacity is (0.7), browser hover (0.88), disabled (0.45). Busy replaces the icon with a progress indicator and blocks repeated action. Native focus behavior is inherited; no custom focus ring is declared.

### Cards / Containers

Alarm rows use surface fill, one-unit outline, panel corners, and `row-inset`. The next-alarm summary uses container fill and `panel-inset`. QR status uses faint or success background according to preparation state, with icon, label, detail, and chevron. Keep status text alongside color.

### Inputs / Fields

Alarm name uses a one-unit outline, surface fill, field corners, padding (16), and minimum height (56). Time inputs sit inside a tonal container with AM/PM controls. Selection uses primary. Invalid time and save errors appear in an explicit error Notice while the draft remains intact.

### Chips / Choices

Repeat days use surface/outline when unselected and container/primary when selected. Dismissal choices are radio rows in a rounded outlined group; selection changes fill, icon color, and radio dot. Both QR challenge and Standard remain available.

### Navigation

Three labeled tabs combine an icon and small text. Selected tabs use a container pill, primary icon/text, and label weight (700); unselected labels use muted and weight (500). Android Back returns to alarms or the previous editor step.

### QR preparation and ringing

The real QR is a functional export, never decorative generated artwork. Preparation combines an explanation, code, placement confirmation, and explicit completion action. Entering setup from the editor preserves the draft. QR ringing presents scanning with no snooze; Standard presents dismiss and five-minute snooze. Browser simulations remain visibly labeled.

## Do's and Don'ts

### Do:

- Do preserve the selected Lucide alarm-clock outline and the approved light/indigo direction. Retain the upstream license notice.
- Do pair each light semantic role with its dark equivalent.
- Do keep both QR and Standard dismissal visible and understandable.
- Do preserve Android Back, safe areas, keyboard handling, and scrolling at large type.
- Do label browser previews and simulated outcomes explicitly.

### Don't:

- Don’t replace Android behavior with Cupertino conventions.
- Don’t add decorative shadows, entrance choreography, or promotional headings to alarm tasks.
- Don’t use generated QR artwork as a scannable code.
- Don’t present browser captures as validation of native alarm delivery, camera scans, or lock-screen behavior.
