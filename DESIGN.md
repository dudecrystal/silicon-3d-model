---
name: Silicon 3D Model
description: Interactive models of naturally stable silicon isotopes.
colors:
  space: "#080B18"
  surface: "#11162A"
  accent: "#9B8AFB"
  sky: "#69B7FF"
  ink: "#C9F7B2"
  muted: "#A7B4C8"
  line: "#283249"
  proton: "#FF7185"
  neutron: "#A78BFA"
  electron: "#65D9FF"
  orbit: "#53667D"
typography:
  headline:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "clamp(24px, 3vw, 34px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "13px"
    lineHeight: 1.7
    letterSpacing: "0.01em"
  label:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "10px"
  statistic:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  compact: "4px"
  particle-label: "5px"
  control: "7px"
  circle: "50%"
spacing:
  control-gap: "7px"
  inline: "12px"
  navigation-gap: "24px"
  legend-gap: "28px"
  desktop-gutter: "40px"
components:
  isotope-button:
    textColor: "{colors.muted}"
    backgroundColor: "transparent"
    rounded: "{rounded.circle}"
    width: "68px"
    height: "68px"
  view-control:
    textColor: "{colors.muted}"
    backgroundColor: "transparent"
    rounded: "{rounded.control}"
  view-control-hover:
    backgroundColor: "{colors.surface}"
    textColor: "#c9e1f7"
  particle-access:
    textColor: "{colors.muted}"
    backgroundColor: "transparent"
    rounded: "{rounded.compact}"
    padding: "7px 8px"
  particle-label:
    backgroundColor: "{colors.surface}"
    textColor: "#e0e7f2"
    rounded: "{rounded.particle-label}"
    padding: "7px 12px"
---

# Design System: Silicon 3D Model

## Overview

**Creative North Star: "Scientific visualization"**

The supplied scientific brief remains the visual authority. The atom is the main visual, with centered identification, circular isotope selection and compact reference information. This document merges the provisional design with the implemented styles; it records the existing direction rather than adding a new brand metaphor.

The dark canvas, restrained interface and readable particle labels support inspection on laptops and phones. Motion communicates selection and camera changes; the model does not rotate while idle.

**Key Characteristics:**

- Dark scientific palette with distinct particle colors.
- One main visualization and compact, flat controls.
- Quiet dividers, circular isotope choices and numeric reference information.
- Keyboard access, visible focus and reduced-motion behavior.

## Colors

The pinned palette uses a near-black blue canvas, purple selection, blue controls and pale green primary text. Exact values live in the frontmatter.

### Primary

- **Selection purple — accent:** isotope selection, mass notation and text selection.
- **Control blue — sky:** silicon symbol and keyboard focus.

### Secondary

- **Particle coral — proton:** proton geometry and its matching legend dot.
- **Particle violet — neutron:** neutron geometry and its matching legend dot; distinct from selection purple.
- **Particle cyan — electron:** electron geometry and its matching legend dot.

### Neutral

- **Space:** page background and loading surface.
- **Surface:** hover surfaces and selected-particle label.
- **Pale green ink:** primary heading and isotope title.
- **Muted blue-gray:** supporting text, labels and inactive controls.
- **Hairline:** dividers and control borders.
- **Orbit gray:** thin shell paths, rendered at partial opacity.

**The Particle Identity Rule.** Preserve the three particle colors and pair them with explicit names and charge labels; color alone must not carry particle identity.

## Typography

All interface text uses self-hosted Manrope Variable with a sans-serif fallback. Medium and semibold weights keep the small scientific labels distinct without introducing a second display family.

- **Headline:** centered project identification; the fluid desktop size becomes 26px below 700px and 23px below 370px.
- **Title:** selected isotope name.
- **Body:** introductory sentence, reduced to 12px on mobile.
- **Label:** reference information and controls; the legend and selected-particle label use 11px on desktop.
- **Statistic:** particle counts with tabular numerals. The mass notation uses 35px and the element symbol uses 32px.

## Layout

The single centered column has a maximum width of 1080px, including horizontal padding. Desktop padding is 48px 40px 30px. Circular isotope buttons are separated by 24px; their centers are 92px apart. The visualization is bounded by one-pixel horizontal dividers, with identification at its upper corners and controls below.

The viewport is 440px tall by default. At a minimum height of 1000px and width of 900px it becomes 510px and the main top padding becomes 65px. At widths up to 700px, main padding is 30px 20px 24px, the viewport becomes 380px, controls and instructions stack, and isotope identity and counts stack. View controls and particle selection actions have a 44px minimum height there. At widths up to 370px, side padding becomes 14px and the viewport becomes 345px. The supported page minimum width is 320px.

## Elevation & Depth

The interface uses no box shadows, bloom or decorative glow. Tonal surfaces and thin borders separate controls. The 3D model gains depth from shaded sphere geometry and directional lighting. A selected particle becomes larger and uses an emissive material; this is a local selection cue, not a postprocessing glow.

## Shapes

Isotope selectors and their persistent selection indicator are circles (68px diameter). View controls have compact rounded corners; the selected-particle label and text selection controls use smaller radii. Borders and section dividers are one pixel. Particles use spheres; electron shell paths are thin circular lines with slight tilt.

## Components

### Isotope navigation

Three circular buttons share one persistent outlined purple indicator with a faint purple fill. Inactive labels are muted; hover adds a translucent surface and brighter border. The indicator moves 92px between positions over 220ms using `cubic-bezier(0.16, 1, 0.3, 1)`, without bounce. Pressed state is exposed through `aria-pressed`.

### View controls

Outlined icon controls use a transparent background, muted text and surface fill on hover. Desktop minimum dimensions are 36px; mobile dimensions increase to 44px. Reset combines a 14px icon with a small text label. Controls remain disabled until the model reports readiness. Disabled controls use 0.45 opacity.

### Particle selection and label

Compact text actions provide a keyboard-accessible route to each particle type. Hover adds the secondary surface. The selected-particle label pairs a seven-pixel color dot with a written particle name and announces changes through a live region. Its opacity enters over 150ms.

### Model and loading state

The canvas supports drag, pinch, particle picking and keyboard camera controls. Selection focuses the camera; user interaction interrupts camera interpolation. GSAP coordinates a 110ms material fade-out and 150ms fade-in on isotope changes, and camera movement uses `power3.out` over 450ms by default or 220ms for keyboard commands. Loading uses outlined circles and a 1.7-second opacity pulse, followed by a 180ms overlay fade. WebGL failure displays explicit text while isotope counts remain available.

**The Motion Restraint Rule.** Reduced motion removes CSS animation and transitions and sets application interpolation durations to zero. Do not add idle rotation.

### Information and legend

The isotope identity sits beside three numeric counts on desktop. Thin vertical rules divide the counts; the mobile layout removes the first rule. The flat legend pairs a colored dot, particle name and charge. There are no dashboard cards, form fields or additional navigation components in this implementation.

### Focus

Buttons and the canvas wrapper use a two-pixel control-blue outline with a five-pixel offset on keyboard focus. Hover styling does not replace this focus cue.

## Do's and Don'ts

### Do:

- **Do** preserve the pinned dark palette and distinct particle colors.
- **Do** keep the atom as the main visual and reference information compact.
- **Do** retain written particle labels, keyboard focus and reduced-motion behavior.
- **Do** use demand rendering and restrained, interruptible state changes.

### Don't:

- **Don't** add decorative glow, bloom, large shadows, imagery or textures.
- **Don't** add idle rotation or bouncing selection motion.
- **Don't** replace the centered scientific layout with dashboard cards or extra pages.
- **Don't** use particle color as the only explanation of particle identity.
